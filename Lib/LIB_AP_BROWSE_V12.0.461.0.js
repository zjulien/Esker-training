/// <reference path="../../AP/Vendor Invoice Processing/typings_withDeleted/Controls_AP_VIP/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_AP_Browse_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "AP library",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_ERP_SAP_Browse",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Array"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Browse;
        (function (Browse) {
            var sapConfigs = {};
            var sapAllowDisplays = {};
            var sapQueryLanguage;
            function InitSAPVariable() {
                sapQueryLanguage = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.CustomQueryLanguage");
                /**
                 * Set vendor custom browse for SAP
                 */
                sapConfigs.ForInternalOrder =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "COAS",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            AUFNR: "InternalOrder__",
                            KTEXT: "Description__"
                        },
                        /**
                         * List of SAP fields to search
                         */
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
                        attSize: 12,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                /**
                 * Set WBS Element custom browse for SAP
                 */
                sapConfigs.ForWBSElement =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "PRPS",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            PBUKR: "CompanyCode__",
                            POSID: "WBSElement__",
                            POST1: "Description__",
                            PSPNR: "WBSElementID__"
                        },
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            PBUKR: "PBUKR",
                            POSID: "POSID",
                            POST1: "POST1",
                            PSPNR: "PSPNR"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "WBSElement__",
                            "Description__"
                        ],
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForWBSElementFromID =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "PRPS",
                        sapField2FFFieldMapping: {
                            POSID: "WBSElement__",
                            PSPNR: "WBSElementID__"
                        },
                        sapSearchFields: {
                            POSID: "POSID",
                            PSPNR: "PSPNR"
                        },
                        ffFieldsInCustomFilter: [
                            "WBSElement__",
                            "WBSElementID__"
                        ],
                        ffFieldKey: "WBSElementID__",
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForTradingPartner =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T880",
                        sapField2FFFieldMapping: {
                            RCOMP: "Company__",
                            NAME1: "CompanyName__",
                            CNTRY: "Country__",
                            CURR: "Currency__"
                        },
                        sapSearchFields: {
                            RCOMP: {
                                sapField: "RCOMP",
                                textCase: "Upper",
                                maxValueLength: 6,
                                pad: {
                                    condition: "Numeric",
                                    position: "Left",
                                    char: "0"
                                }
                            },
                            NAME1: "NAME1",
                            CNTRY: "CNTRY",
                            CURR: "CURR"
                        },
                        ffFieldsInCustomFilter: [
                            "Company__",
                            "CompanyName__"
                        ],
                        fieldFormatters: {
                            Company__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                function buildBeginEndDateFilter(queryResult, ldapFilter) {
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
                }
                function sapDateToLocalDate(sapDate) {
                    // sapDate: YYYYMMDD
                    var date = Sys.Helpers.Date.ShortDateStringToDate(sapDate);
                    return Sys.Helpers.Date.ToLocaleDateEx(date, User.culture);
                }
                /** @this amountAccordingToInvoiceType */
                function amountAccordingToInvoiceType(records, recordsDefinition /*, jsonResults?: any*/) {
                    var iDefInvoiceType = recordsDefinition.Get("DocumentType__");
                    var iDefCurrency = recordsDefinition.Get("InvoiceCurrency__");
                    var iDefAmount = recordsDefinition.Get("InvoiceAmount__");
                    var iDefTaxAmount = recordsDefinition.Get("TaxAmount__");
                    var iDefUnplannedDCosts = recordsDefinition.Get("UnplannedDeliveryCosts__");
                    var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                    var useUserCultureForAmount = this.useUserCultureForAmount;
                    function applyMods(record, index, factor, credit) {
                        if (index) {
                            var value = parseFloat(record[index]);
                            if (factor !== 1) {
                                value *= factor;
                                value = parseFloat(value.toFixed(4));
                            }
                            if (credit) {
                                value = -value;
                            }
                            record[index] = useUserCultureForAmount ? Language.FormatNumber(value) : value.toString(10);
                        }
                    }
                    Sys.Helpers.Array.ForEach(records, function (record) {
                        var currency = record[iDefCurrency];
                        var credit = record[iDefInvoiceType] === "KG";
                        var factor = 1;
                        if (customExternalFactors && customExternalFactors[currency]) {
                            factor = customExternalFactors[currency];
                        }
                        else if (Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors && Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency]) {
                            factor = Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency];
                        }
                        applyMods(record, iDefAmount, factor, credit);
                        applyMods(record, iDefTaxAmount, factor, credit);
                        applyMods(record, iDefUnplannedDCosts, factor, credit);
                    });
                    return records;
                }
                sapConfigs.ForInvoiceMM =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "RBKP",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            LIFNR: "VendorNumber__",
                            QSSKZ: "WithholdingTax__",
                            BELNR: "ERPMMInvoiceNumber__",
                            XBLNR: "InvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            BLDAT: "InvoiceDate__",
                            BUDAT: "ERPPostingDate__",
                            RMWWR: "InvoiceAmount__",
                            WAERS: "InvoiceCurrency__",
                            BLART: "DocumentType__",
                            WMWST1: "TaxAmount__",
                            ZLSPR: "ERPPaymentBlocked__",
                            GSBER: "BusinessArea__",
                            ZUONR: "Assignment__",
                            SGTXT: "InvoiceDescription__",
                            ZFBDT: "BaselineDate__",
                            ZTERM: "PaymentTerms__",
                            ZLSCH: "SAPPaymentMethod__",
                            REBZG: "InvoiceReferenceNumber__",
                            REBZJ: "InvoiceReferenceFiscalYear__",
                            BKTXT: "HeaderText__",
                            EMPFB: "AlternativePayee__",
                            BEZNK: "UnplannedDeliveryCosts__",
                            XINVE: "Investment__"
                        },
                        sapAdditionalFields: [
                            "GJAHR"
                        ],
                        sapFilterBuilder: buildBeginEndDateFilter,
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            BUKRS: "BUKRS",
                            LIFNR: "LIFNR",
                            XBLNR: {
                                sapField: "XBLNR",
                                textCase: "Upper"
                            },
                            GJAHR: "GJAHR"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "VendorNumber__",
                            "InvoiceNumber__",
                            "FiscalYear__",
                            "ERPMMInvoiceNumber__"
                        ],
                        sapSearchValueFormatters: {
                            LIFNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10),
                            BELNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        /**
                         * Formatting at input
                         */
                        fieldFormatters: {
                            InvoiceDate__: sapDateToLocalDate,
                            ERPPostingDate__: sapDateToLocalDate,
                            AlternativePayee__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            VendorNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            ERPMMInvoiceNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        currencyDependent: true,
                        useUserCultureForAmount: true,
                        resultFormatter: amountAccordingToInvoiceType,
                        /**
                         * Field to search for autocompletion
                         */
                        autoCompletionFFField: "InvoiceNumber__",
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForFIHeaderText =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "BKPF",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            BELNR: "ERPInvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            BKTXT: "HeaderText__",
                            AWTYP: "AWTYP"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "ERPInvoiceNumber__",
                            "FiscalYear__"
                        ],
                        ffFieldKey: "ERPInvoiceNumber__"
                    };
                sapConfigs.ForFIPayee =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "BSEG",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            BELNR: "ERPInvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            EMPFB: "AlternativePayee__",
                            KOART: "KOART",
                            BUZEI: "BUZEI"
                        },
                        sapFilterBuilder: function (queryResult) {
                            var filter = "";
                            if (queryResult && queryResult.Records) {
                                var ffFieldKey = "ERPInvoiceNumber__";
                                var sapField = "BELNR";
                                ffFieldKey = ffFieldKey.toUpperCase();
                                for (var i = 0; i < queryResult.Records.length; i++) {
                                    var value = queryResult.GetQueryValue(ffFieldKey, i);
                                    filter += "| OR ";
                                    filter += sapField + " = '" + value + "'";
                                }
                                if (filter) {
                                    filter = "( " + filter.substr(5) + " )";
                                }
                            }
                            // Find vendor account line. Changed in S104. was "BUZEI = '1'" before
                            var filterFinal = "KOART = 'K'";
                            if (filter) {
                                filterFinal += "| AND " + filter;
                            }
                            return filterFinal;
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "ERPInvoiceNumber__",
                            "FiscalYear__"
                        ],
                        ffFieldKey: "ERPInvoiceNumber__",
                        sapAdditionalFields: [
                            // Account type
                            "KOART",
                            // Row number
                            "BUZEI"
                        ]
                    };
                sapConfigs.ForInvoiceFI =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: [
                            "BSIK",
                            "BSAK"
                        ],
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            LIFNR: "VendorNumber__",
                            QSSKZ: "WithholdingTax__",
                            BELNR: "ERPInvoiceNumber__",
                            XBLNR: "InvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            BLDAT: "InvoiceDate__",
                            BUDAT: "ERPPostingDate__",
                            WRBTR: "InvoiceAmount__",
                            WAERS: "InvoiceCurrency__",
                            BLART: "DocumentType__",
                            WMWST: "TaxAmount__",
                            ZLSPR: "ERPPaymentBlocked__",
                            GSBER: "BusinessArea__",
                            ZUONR: "Assignment__",
                            SGTXT: "InvoiceDescription__",
                            ZFBDT: "BaselineDate__",
                            ZTERM: "PaymentTerms__",
                            ZLSCH: "SAPPaymentMethod__",
                            REBZG: "InvoiceReferenceNumber__",
                            REBZJ: "InvoiceReferenceFiscalYear__",
                            SubField01: {
                                ffField: "AWTYP",
                                sapConfig: sapConfigs.ForFIHeaderText
                            },
                            SubField02: {
                                ffField: "HeaderText__",
                                sapConfig: sapConfigs.ForFIHeaderText
                            },
                            SubField03: {
                                ffField: "AlternativePayee__",
                                sapConfig: sapConfigs.ForFIPayee
                            }
                        },
                        sapAdditionalFields: [
                            "GJAHR"
                        ],
                        sapFilterBuilder: buildBeginEndDateFilter,
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            BUKRS: "BUKRS",
                            LIFNR: "LIFNR",
                            XBLNR: {
                                sapField: "XBLNR",
                                textCase: "Upper"
                            },
                            GJAHR: "GJAHR"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "VendorNumber__",
                            "InvoiceNumber__",
                            "FiscalYear__",
                            "ERPInvoiceNumber__"
                        ],
                        sapSearchValueFormatters: {
                            LIFNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10),
                            BELNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        /**
                         * Formatting at input
                         */
                        fieldFormatters: {
                            InvoiceDate__: sapDateToLocalDate,
                            ERPPostingDate__: sapDateToLocalDate,
                            AlternativePayee__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            VendorNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            ERPInvoiceNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        currencyDependent: true,
                        useUserCultureForAmount: true,
                        resultFormatter: amountAccordingToInvoiceType,
                        ffFieldKey: "ERPInvoiceNumber__",
                        /**
                         * Field to search for autocompletion
                         */
                        autoCompletionFFField: "InvoiceNumber__",
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForGlAccountDescription = Lib.P2P.Browse.GetSapConfigForGlAccountDescription("GLAccount__", "GLDescription__");
                sapConfigs.ForCostCenterDescription = Lib.P2P.Browse.GetSapConfigForCostCenterDescription("CCDescription__");
                sapConfigs.ForInvoiceItemsMM =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of BAPI function to use
                         */
                        sapQueryMethod: {
                            type: "BAPI",
                            name: "BAPI_INCOMINGINVOICE_GETDETAIL"
                        },
                        sapSearchFields: {
                            INVOICEDOCNUMBER: "ERPMMInvoiceNumber__",
                            FISCALYEAR: "FiscalYear__"
                        },
                        sapSearchValueFormatters: {
                            INVOICEDOCNUMBER: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        bapiResultDefinition: {
                            Headers: {
                                HEADERDATA: {
                                    COMP_CODE: "CompanyCode__"
                                }
                            },
                            Tables: {
                                ITEMDATA: {
                                    PO_NUMBER: "OrderNumber__",
                                    PO_ITEM: "ItemNumber__",
                                    ITEM_AMOUNT: "Amount__",
                                    QUANTITY: "Quantity__",
                                    TAX_CODE: "TaxCode__",
                                    TAXJURCODE: "TaxJurisdiction__",
                                    ITEM_TEXT: "Description__",
                                    DEBIT_CREDIT_INDICATOR: "DEBIT_CREDIT_INDICATOR"
                                },
                                ACCOUNTINGDATA: {
                                    ITEM_AMOUNT: "Amount__",
                                    QUANTITY: "Quantity__",
                                    TAX_CODE: "TaxCode__",
                                    TAXJURCODE: "TaxJurisdiction__",
                                    GL_ACCOUNT: "GLAccount__",
                                    GLDescription__: {
                                        ffField: "GLDescription__",
                                        sapConfig: sapConfigs.ForGlAccountDescription
                                    },
                                    COSTCENTER: "CostCenter__",
                                    CCDescription__: {
                                        ffField: "CCDescription__",
                                        sapConfig: __assign(__assign({}, sapConfigs.ForCostCenterDescription), { isAOneTableQuery: false })
                                    },
                                    ORDERID: "InternalOrder__",
                                    WBS_ELEM: "WBSElementID__",
                                    WBSElement__: {
                                        ffField: "WBSElement__",
                                        sapConfig: sapConfigs.ForWBSElementFromID
                                    },
                                    BUS_AREA: "BusinessArea__"
                                },
                                GLACCOUNTDATA: {
                                    GL_ACCOUNT: "GLAccount__",
                                    GLDescription__: "GLDescription__",
                                    TAX_CODE: "TaxCode__",
                                    DB_CR_IND: "DEBIT_CREDIT_INDICATOR",
                                    ITEM_AMOUNT: "Amount__",
                                    TAXJURCODE: "TaxJurisdiction__",
                                    ITEM_TEXT: "Description__",
                                    COSTCENTER: "CostCenter__",
                                    CCDescription__: "CCDescription__",
                                    ORDERID: "InternalOrder__",
                                    WBS_ELEM: "WBSElementID__",
                                    WBSElement__: "WBSElement__",
                                    BUS_AREA: "BusinessArea__"
                                }
                            },
                            tableLinks: [
                                {
                                    name: "PO_LINE_ITEM",
                                    tables: ["ITEMDATA", "ACCOUNTINGDATA"],
                                    key: "INVOICE_DOC_ITEM"
                                },
                                {
                                    name: "GL_LINE_ITEM",
                                    tables: ["GLACCOUNTDATA"]
                                }
                            ],
                        },
                        fieldFormatters: {
                            CostCenter__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            GLAccount__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            InternalOrder__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        resultFormatter: function (records, recordsDefinition, jsonResult) {
                            if (!jsonResult || !jsonResult.TABLES || !jsonResult.TABLES.TAXDATA) {
                                Log.Error("No tax data retrieved from SAP");
                                return records;
                            }
                            // complete records definition with tax info
                            var taxAmountDef = recordsDefinition.Add("TAXAMOUNT__");
                            // taxdata map
                            var taxData = {};
                            Sys.Helpers.Array.ForEach(jsonResult.TABLES.TAXDATA, function (data) {
                                taxData[data.TAX_CODE] = { taxAmount: data.TAX_AMOUNT, totalAmount: 0 };
                            });
                            // compute total amount by tax code
                            var iDefDebitCredit = recordsDefinition.Get("DEBIT_CREDIT_INDICATOR");
                            var iDefAmount = recordsDefinition.Get("Amount__");
                            var iDefTaxCode = recordsDefinition.Get("TAXCODE__");
                            Sys.Helpers.Array.ForEach(records, function (record) {
                                if (record[iDefDebitCredit] === "H") {
                                    record[iDefAmount] = -record[iDefAmount];
                                }
                                var taxCode = record[iDefTaxCode];
                                // if not defined - tax exempt...
                                if (taxCode in taxData) {
                                    taxData[taxCode].totalAmount += record[iDefAmount];
                                }
                            });
                            // Compute tax amount for each records
                            Sys.Helpers.Array.ForEach(records, function (record) {
                                var taxCode = record[iDefTaxCode];
                                // if not defined - tax exempt...
                                if (taxCode in taxData) {
                                    var taxCodeData = taxData[taxCode];
                                    record[taxAmountDef] = Math.abs(record[iDefAmount] / taxCodeData.totalAmount * taxCodeData.taxAmount);
                                    if (record[iDefDebitCredit] === "H") {
                                        record[taxAmountDef] = -record[taxAmountDef];
                                    }
                                }
                                else {
                                    record[taxAmountDef] = 0;
                                }
                            });
                            return records;
                        },
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                // Tax amount:
                //	sum up the amount for each BSET-TXGRP
                //	associate to BSEG-TXGRP = BSET-TXGRP
                sapConfigs.ForTaxAmountFI =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "BSET",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            BELNR: "ERPInvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            TXGRP: "TXGRP",
                            FWSTE: "TaxAmount__",
                            SHKZG: "SHKZG"
                        },
                        sapAdditionalFields: [
                            "TXGRP",
                            "SHKZG"
                        ],
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "FiscalYear__",
                            "ERPInvoiceNumber__"
                        ],
                        resultFormatter: function (records, recordsDefinition) {
                            var currency = Data.GetValue("InvoiceCurrency__");
                            var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                            var factor = 1;
                            if (customExternalFactors && customExternalFactors[currency]) {
                                factor = customExternalFactors[currency];
                            }
                            else if (Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors && Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency]) {
                                factor = Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency];
                            }
                            var iDefTXGRP = recordsDefinition.Get("TXGRP");
                            var iDefTaxAmount = recordsDefinition.Get("TAXAMOUNT__");
                            var iDefDebitCredit = recordsDefinition.Get("SHKZG");
                            var newRecords = [];
                            Sys.Helpers.Array.ForEach(records, function (record) {
                                var TXTGRP = record[iDefTXGRP];
                                if (!Sys.Helpers.Array.Find(newRecords, function (record2) {
                                    return record2[iDefTXGRP] === TXTGRP;
                                })) {
                                    var amount_1 = 0;
                                    Sys.Helpers.Array.ForEach(records, function (record3) {
                                        if (record3[iDefTXGRP] === TXTGRP) {
                                            var taxAmount = parseFloat(record3[iDefTaxAmount]);
                                            if (factor !== 1) {
                                                taxAmount *= factor;
                                                taxAmount = parseFloat(taxAmount.toFixed(4));
                                            }
                                            if (record3[iDefDebitCredit] === "H") {
                                                taxAmount = -taxAmount;
                                            }
                                            amount_1 += taxAmount;
                                        }
                                    });
                                    record[iDefTaxAmount] = amount_1.toString(10);
                                    newRecords.push(record);
                                }
                            });
                            return newRecords;
                        },
                        resultMerger: function (finalQueryResult, queryResult) {
                            // Remove tax lines retrieved from SAP - identified with BUZID = 'T'
                            var isNetAmount = false;
                            var iDefBUZID = finalQueryResult.RecordsDefinition.Get("BUZID");
                            for (var i = finalQueryResult.Records.length - 1; i >= 0; i--) {
                                var record = finalQueryResult.Records[i];
                                if (record[iDefBUZID] === "T") {
                                    finalQueryResult.Records.splice(i, 1);
                                    isNetAmount = true;
                                }
                            }
                            // distribution of tax amount on each lines
                            var amountDef = finalQueryResult.RecordsDefinition.Get("AMOUNT__");
                            var taxAmountDef = finalQueryResult.RecordsDefinition.Get("TAXAMOUNT__");
                            var taxIDDef = finalQueryResult.RecordsDefinition.Get("TXGRP");
                            var taxAmountDef_queryResult = queryResult.RecordsDefinition.Get("TAXAMOUNT__");
                            var taxIDDef_queryResult = queryResult.RecordsDefinition.Get("TXGRP");
                            // taxdata map (key by TXGRP not TaxCode)
                            var taxData = {};
                            Sys.Helpers.Array.ForEach(queryResult.Records, function (rec) {
                                taxData[rec[taxIDDef_queryResult]] = { taxAmount: parseFloat(rec[taxAmountDef_queryResult]), totalAmount: 0 };
                            });
                            // compute total amount by tax code
                            Sys.Helpers.Array.ForEach(finalQueryResult.Records, function (rec) {
                                var taxID = rec[taxIDDef];
                                if (!taxData[taxID]) {
                                    taxData[taxID] = { taxAmount: 0, totalAmount: 0 };
                                }
                                var amount = parseFloat(rec[amountDef]);
                                taxData[taxID].totalAmount += amount;
                            });
                            // Compute tax amount for each records and add taxamount to amount if 'isNetAmount' flag is true
                            Sys.Helpers.Array.ForEach(finalQueryResult.Records, function (rec) {
                                var taxID = rec[taxIDDef];
                                var taxIDData = taxData[taxID];
                                var amount = parseFloat(rec[amountDef]);
                                if (amount != taxIDData.taxAmount) {
                                    rec[taxAmountDef] = amount / taxIDData.totalAmount * taxIDData.taxAmount;
                                    if (isNetAmount) {
                                        rec[amountDef] = amount + rec[taxAmountDef];
                                    }
                                }
                                else {
                                    rec[taxAmountDef] = amount;
                                }
                            });
                            return true;
                        },
                        ffFieldKey: "TXGRP"
                    };
                sapConfigs.ForInvoiceItemsFI =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "BSEG",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            BELNR: "ERPInvoiceNumber__",
                            GJAHR: "FiscalYear__",
                            EBELN: "OrderNumber__",
                            SGTXT: "Description__",
                            MENGE: "Quantity__",
                            // !!! Amount__ is net amount. WRBTR is net amount if BUZID equals T, WRBTR is amount with the tax amount if BUZID does not equal T
                            WRBTR: "Amount__",
                            SHKZG: "SHKZG",
                            HKONT: "GLAccount__",
                            SAKNR: {
                                ffField: "GLDescription__",
                                sapConfig: sapConfigs.ForGlAccountDescription
                            },
                            KOSTL: "CostCenter__",
                            KSTRG: {
                                ffField: "CCDescription__",
                                optional: true,
                                sapConfig: __assign(__assign({}, sapConfigs.ForCostCenterDescription), { isAOneTableQuery: false })
                            },
                            AUFNR: "InternalOrder__",
                            GSBER: "BusinessArea__",
                            ZUONR: "Assignment__",
                            MWSKZ: "TaxCode__",
                            TXJCD: "TaxJurisdiction__",
                            TXGRP: "TXGRP",
                            BUZID: "BUZID",
                            WMWST: {
                                ffField: "TaxAmount__",
                                sapConfig: sapConfigs.ForTaxAmountFI
                            },
                            KOART: "KOART",
                            BUZEI: "BUZEI",
                            PROJK: "WBSElementID__",
                            APLZL: {
                                ffField: "WBSElement__",
                                sapConfig: sapConfigs.ForWBSElementFromID
                            },
                            VBUND: "TradingPartner__"
                        },
                        sapAdditionalFields: [
                            "GJAHR",
                            "TXGRP",
                            "BUZID",
                            "SHKZG",
                            "KOART",
                            "BUZEI"
                        ],
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            BUKRS: "BUKRS",
                            BELNR: "BELNR",
                            GJAHR: "GJAHR"
                        },
                        sapFilterBuilder: function () {
                            // First line item
                            // changed in S104. Was "BUZEI > '1'" before
                            return "( KOART = 'S' OR KOART = 'A' )";
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "FiscalYear__",
                            "ERPInvoiceNumber__"
                        ],
                        sapSearchValueFormatters: {
                            BELNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        fieldFormatters: {
                            CostCenter__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            GLAccount__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            InternalOrder__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            TradingPartner__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        currencyDependent: true,
                        resultFormatter: function (records, recordsDefinition) {
                            var currency = Data.GetValue("InvoiceCurrency__");
                            var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                            var factor = 1;
                            if (customExternalFactors && customExternalFactors[currency]) {
                                factor = customExternalFactors[currency];
                            }
                            else if (Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors && Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency]) {
                                factor = Sys.ERP.SAP.Browse.sapCurrenciesExternalFactors[currency];
                            }
                            var iDefDebitCredit = recordsDefinition.Get("SHKZG");
                            var iDefAmount = recordsDefinition.Get("Amount__");
                            for (var i = records.length - 1; i >= 0; i--) {
                                var record = records[i];
                                var amount = parseFloat(record[iDefAmount]);
                                if (factor !== 1) {
                                    amount *= factor;
                                    amount = parseFloat(amount.toFixed(4));
                                }
                                if (record[iDefDebitCredit] === "H") {
                                    amount = -amount;
                                }
                                record[iDefAmount] = amount.toString(10);
                            }
                            return records;
                        },
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForCountry =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T001",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            LAND1: "LAND1"
                        },
                        sapFilterBuilder: function () {
                            return "BUKRS = '" + (Controls.CompanyCode__.GetValue() || "") + "'";
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__"
                        ],
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForPaymentMethod =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T042Z",
                        sapField2FFFieldMapping: {
                            TEXT1: "Description__",
                            ZLSCH: "ID__"
                        },
                        sapSearchFields: {
                            TEXT1: "TEXT1",
                            ZLSCH: "ZLSCH"
                        },
                        ffFieldsInCustomFilter: [
                            "Description__",
                            "ID__"
                        ],
                        sapExtraFields: {
                            // search for country code before
                            LAND1: sapConfigs.ForCountry
                        },
                        languageDependent: false,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForBusinessAreaList =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        useSAPBapiLocalCache: true,
                        sapQueryMethod: {
                            type: "BAPI",
                            name: "BAPI_BUSINESSAREA_GETLIST"
                        },
                        sapSearchFields: {
                            BUS_AREA: {
                                ffField: "BusinessArea__",
                                notBapiParam: true,
                                maxValueLength: 4
                            },
                            BUS_AR_DES: {
                                ffField: "Description__",
                                notBapiParam: true
                            }
                        },
                        bapiResultDefinition: {
                            Tables: {
                                BUSINESSAREA_LIST: {
                                    BUS_AREA: "BusinessArea__",
                                    BUS_AR_DES: "Description__"
                                }
                            }
                        },
                        isAOneTableQuery: true,
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                        querySAPWSLanguageHandler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPGetISOLanguage : null
                    };
                sapConfigs.ForAlternativePayee =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "LFZA",
                        sapField2FFFieldMapping: {
                            LIFNR: "VendorNumber__",
                            EMPFK: "AlternativePayee__"
                        },
                        sapAdditionalFields: [
                            "EMPFK"
                        ],
                        sapSearchFields: {
                            LIFNR: "LIFNR",
                            EMPFK: {
                                sapField: "EMPFK",
                                maxValueLength: 10,
                                pad: {
                                    condition: "Numeric",
                                    position: "Left",
                                    char: "0"
                                }
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "VendorNumber__",
                            "AlternativePayee__"
                        ],
                        sapFilterBuilder: function (queryResult, ldapFilter) {
                            var filter = "BUKRS = ''";
                            var companyCode = Sys.ERP.SAP.Browse.ExtractFieldValue(ldapFilter, "CompanyCode__");
                            if (companyCode) {
                                filter += " OR BUKRS = '" + companyCode + "'";
                            }
                            return "( " + filter + " )";
                        },
                        sapSearchValueFormatters: {
                            LIFNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10),
                            EMPFK: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        resultFormatter: function (records, recordsDefinition) {
                            var iDefNumber = recordsDefinition.Add("LIFNR");
                            var iDefPayee = recordsDefinition.Get("AlternativePayee__");
                            for (var i = 0; i < records.length; i++) {
                                var record = records[i];
                                record[iDefNumber] = record[iDefPayee];
                            }
                            return records;
                        },
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForVendorAlternativePayee = Sys.Helpers.Extend({}, Lib.P2P.Browse.GetSapConfigForVendor(), {
                    sapExtraFields: {
                        LIFNR: sapConfigs.ForAlternativePayee
                    },
                    ffFieldsInCustomFilter: [
                        "CompanyCode__"
                    ],
                    attName: "AlternativePayee__="
                });
                sapConfigs.ForExtendedWHTDescription =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T059ZT",
                        sapField2FFFieldMapping: {
                            WITHT: "WHTType__",
                            WT_WITHCD: "WHTCode__",
                            TEXT40: "WHTDescription__",
                            SPRAS: "SPRAS"
                        },
                        sapSearchFields: {
                            WITHT: {
                                sapField: "WITHT",
                                maxValueLength: 2,
                                textCase: "Upper"
                            },
                            WT_WITHCD: {
                                sapField: "WT_WITHCD",
                                maxValueLength: 2,
                                textCase: "Upper"
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "WHTType__",
                            "WHTCode__"
                        ],
                        ffFieldKey: "WHTType__|WHTCode__",
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                        sapFilterBuilder: function (queryResult) {
                            var filter = "";
                            if (queryResult && queryResult.Records) {
                                for (var i = 0; i < queryResult.Records.length; i++) {
                                    var type = queryResult.GetQueryValue("WHTTYPE__", i);
                                    var code = queryResult.GetQueryValue("WHTCODE__", i);
                                    filter += "| OR ";
                                    filter += "( WITHT = '" + type + "' AND  WT_WITHCD = '" + code + "' )";
                                }
                                if (filter) {
                                    filter = "( " + filter.substr(5) + " )";
                                }
                            }
                            var filterFinal = "LAND1 = '" + Controls.VendorCountry__.GetValue() + "'";
                            if (filter) {
                                filterFinal += "| AND " + filter;
                            }
                            return filterFinal;
                        }
                    };
                sapConfigs.ForExtendingWHTCode =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T059ZT",
                        sapField2FFFieldMapping: {
                            WT_WITHCD: "WHTCode__",
                            WITHT: "WHTType__",
                            TEXT40: "WHTDescription__",
                            SPRAS: "SPRAS"
                        },
                        sapSearchFields: {
                            WT_WITHCD: {
                                sapField: "WT_WITHCD",
                                maxValueLength: 2,
                                textCase: "Upper"
                            },
                            WITHT: {
                                sapField: "WITHT",
                                maxValueLength: 2,
                                textCase: "Upper"
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "WHTCode__",
                            "WHTType__"
                        ],
                        ffFieldKey: "WHTCode__",
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                        isAOneTableQuery: true,
                        sapFilterBuilder: function (queryResult, ldapFilter, sapAttributes, ctrl) {
                            var filter = "( LAND1 = '" + Controls.VendorCountry__.GetValue() + "'";
                            filter += " AND WITHT = '" + ctrl.GetRow().WHTType__.GetValue() + "' )";
                            return filter;
                        },
                    };
                sapConfigs.ForExtendingWHTType =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "LFBW",
                        sapField2FFFieldMapping: {
                            WITHT: "WHTType__",
                            WT_WITHCD: "WHTCode__",
                            WT_SUBJCT: {
                                ffField: "WHTDescription__",
                                sapConfig: sapConfigs.ForExtendedWHTDescription
                            }
                        },
                        sapSearchFields: {
                            WITHT: {
                                sapField: "WITHT",
                                maxValueLength: 2,
                                textCase: "Upper"
                            },
                            WT_WITHCD: {
                                sapField: "WT_WITHCD",
                                maxValueLength: 2,
                                textCase: "Upper"
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "WHTType__",
                            "WHTCode__"
                        ],
                        ffFieldKey: "WHTType__",
                        sapFilterBuilder: function () {
                            var vendorNumber = Data.GetValue("VendorNumber__") || "";
                            var filter = "( BUKRS = '" + (Controls.CompanyCode__.GetValue() || "") + "'";
                            filter += "AND LIFNR = '" + Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10) + "' )";
                            return filter;
                        },
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapConfigs.ForExtendedWHTItems =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "WITH_ITEM",
                        sapField2FFFieldMapping: {
                            WITHT: "WHTType__",
                            SubField01: {
                                ffField: "WHTDescription__",
                                sapConfig: sapConfigs.ForExtendedWHTDescription
                            },
                            WT_WITHCD: "WHTCode__",
                            WT_QSSHB: "WHTBaseAmount__",
                            WT_QBSHB: "WHTTaxAmount__",
                            BUKRS: "CompanyCode__",
                            BELNR: "ERPInvoiceNumber__",
                            GJAHR: "FiscalYear__"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "FiscalYear__",
                            "ERPInvoiceNumber__"
                        ],
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                sapAllowDisplays.ForExtendedWHTCode = function (ctrl) {
                    var currentRow = ctrl.GetRow();
                    if (!currentRow.WHTType__.GetValue()) {
                        Log.Error("No wihtholding type please select a wihtholding type first");
                        Popup.Alert("_Please choose a wihtholding type first.", false, null, "_Warning");
                        return false;
                    }
                    return true;
                };
                sapAllowDisplays.ForExtendedWHTType = function () {
                    if (!Controls.VendorNumber__.GetValue()) {
                        Log.Error("No Vendor please select a vendor first");
                        Popup.Alert("_Please choose a vendor first.", false, null, "_Warning");
                        return false;
                    }
                    return true;
                };
            }
            function InitBrowseInvoices(ctrl) {
                var ShowWarningMessage = function (searchFieldMapping) {
                    for (var key in searchFieldMapping) {
                        if ((key === "CompanyCode__" || key === "FiscalYear__") && !searchFieldMapping[key]) {
                            var translatedFields = [
                                Language.Translate("_Company code", false),
                                Language.Translate("FiscalYear__", false)
                            ];
                            return {
                                DoSearch: true,
                                WarningMessage: Language.Translate("_SAP search performance issue : if you encounter a timeout, please fill fields ({0})", false, translatedFields.join(", "))
                            };
                        }
                    }
                    return {
                        DoSearch: true
                    };
                };
                var isFI = ctrl !== Controls.ERPMMInvoiceNumber__;
                var showCompanyCode = ctrl !== Controls.InvoiceReferenceNumber__;
                ctrl.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, isFI ? sapConfigs.ForInvoiceFI : sapConfigs.ForInvoiceMM, null, ShowWarningMessage);
                ctrl.ClearSearchFields();
                if (showCompanyCode) {
                    ctrl.AddSearchField({
                        type: "Text", label: "CompanyCode__", id: "CompanyCode__",
                        customize: function (field) {
                            field.SetValue(Controls.CompanyCode__.GetValue());
                        }
                    });
                    ctrl.AddSearchField({
                        type: "Text", label: "InvoiceNumber__", id: "InvoiceNumber__",
                        customize: function (field) {
                            field.SetValue(Controls.InvoiceNumber__.GetValue());
                        }
                    });
                }
                else {
                    ctrl.AddSearchField("InvoiceNumber__");
                }
                ctrl.AddSearchField("FiscalYear__");
                ctrl.AddSearchField({ type: "Date", label: "BeginDate__", id: "BeginDate__" });
                ctrl.AddSearchField({ type: "Date", label: "EndDate__", id: "EndDate__" });
                ctrl.OnSelectItem = function (item) {
                    var nb = item.GetValue(isFI ? "ERPInvoiceNumber__" : "ERPMMInvoiceNumber__");
                    var cc = null;
                    if (isFI) {
                        cc = showCompanyCode ? item.GetValue("CompanyCode__") : Controls.CompanyCode__.GetValue();
                    }
                    var date = item.GetValue("FiscalYear__");
                    var year = Sys.Helpers.Date.LocalDateStringToYear(date, User.culture);
                    ctrl.SetValue(Lib.AP.FormatInvoiceDocumentNumber(nb, year, cc));
                };
            }
            Browse.InitBrowseInvoices = InitBrowseInvoices;
            function Init(erpInvoiceInstance) {
                Lib.P2P.Browse.Init("AP", "LineItems__", erpInvoiceInstance);
                var storedInLocalTableFields = erpInvoiceInstance ? erpInvoiceInstance.GetStoredInLocalTableFields() : null;
                Controls.PaymentTerms__.ClearSearchFields();
                Controls.PaymentTerms__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.PaymentTerms__));
                Controls.LineItems__.InternalOrder__.ClearSearchFields();
                Controls.LineItems__.InternalOrder__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__.InternalOrder__));
                Controls.LineItems__.WBSElement__.ClearSearchFields();
                Controls.LineItems__.WBSElement__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__.WBSElement__));
                Controls.SAPPaymentMethod__.ClearSearchFields();
                Controls.SAPPaymentMethod__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.SAPPaymentMethod__));
                Controls.AlternativePayee__.ClearSearchFields();
                Controls.AlternativePayee__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.AlternativePayee__));
                Controls.BusinessArea__.ClearSearchFields();
                Controls.LineItems__.BusinessArea__.ClearSearchFields();
                var isSAP = Lib.P2P.Browse.GetBrowseERPName() === "SAP";
                if (isSAP) {
                    InitSAPVariable();
                    Controls.PaymentTerms__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, Lib.P2P.Browse.GetSapConfigForPaymentTerms());
                    Controls.PaymentTerms__.AddSearchField("PaymentTermCode__");
                    Lib.AP.Browse.InitBrowseInvoices(Controls.InvoiceReferenceNumber__);
                    Lib.AP.Browse.InitBrowseInvoices(Controls.ERPInvoiceNumber__);
                    Lib.AP.Browse.InitBrowseInvoices(Controls.ERPMMInvoiceNumber__);
                    Controls.LineItems__.InternalOrder__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForInternalOrder);
                    Controls.LineItems__.InternalOrder__.AddSearchField("InternalOrder__");
                    Controls.LineItems__.InternalOrder__.AddSearchField("Description__");
                    Controls.LineItems__.WBSElement__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForWBSElement);
                    Controls.LineItems__.WBSElement__.AddSearchField("WBSElement__");
                    Controls.LineItems__.WBSElement__.AddSearchField("Description__");
                    Controls.SAPPaymentMethod__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForPaymentMethod);
                    Controls.SAPPaymentMethod__.AddSearchField("ID__");
                    Controls.SAPPaymentMethod__.AddSearchField("Description__");
                    Controls.AlternativePayee__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForVendorAlternativePayee);
                    Controls.AlternativePayee__.AddSearchField("AlternativePayee__");
                    Controls.BusinessArea__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForBusinessAreaList);
                    Controls.BusinessArea__.AddSearchField("BusinessArea__");
                    Controls.BusinessArea__.AddSearchField("Description__");
                    Controls.LineItems__.BusinessArea__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForBusinessAreaList);
                    Controls.LineItems__.BusinessArea__.AddSearchField("BusinessArea__");
                    Controls.LineItems__.BusinessArea__.AddSearchField("Description__");
                    Controls.LineItems__.TradingPartner__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForTradingPartner);
                    Controls.LineItems__.TradingPartner__.AddSearchField("Company__");
                    Controls.LineItems__.TradingPartner__.AddSearchField("CompanyName__");
                    Controls.LineItems__.GLAccount__.OnBrowse = function () {
                        return changeFilter.call(this);
                    };
                    Controls.LineItems__.CostCenter__.OnBrowse = function () {
                        return changeFilter.call(this);
                    };
                    Controls.LineItems__.WBSElement__.OnBrowse = function () {
                        return changeFilter.call(this);
                    };
                    Controls.LineItems__.InternalOrder__.OnBrowse = function () {
                        return changeFilter.call(this);
                    };
                    Controls.ExtendedWithholdingTax__.WHTType__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForExtendingWHTType, sapAllowDisplays.ForExtendedWHTType);
                    Controls.ExtendedWithholdingTax__.WHTType__.AddSearchField("WHTType__");
                    Controls.ExtendedWithholdingTax__.WHTType__.OnSelectItem = function (item) {
                        var currentRow = this.GetRow();
                        currentRow.WHTCode__.SetValue(item.GetValue("WHTCode__"));
                        currentRow.WHTDescription__.SetValue(item.GetValue("WHTDescription__"));
                    };
                    Controls.ExtendedWithholdingTax__.WHTCode__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigs.ForExtendingWHTCode, sapAllowDisplays.ForExtendedWHTCode);
                    Controls.ExtendedWithholdingTax__.WHTCode__.AddSearchField("WHTCode__");
                    Controls.ExtendedWithholdingTax__.WHTCode__.OnSelectItem = function (item) {
                        var currentRow = this.GetRow();
                        currentRow.WHTDescription__.SetValue(item.GetValue("WHTDescription__"));
                    };
                }
                else {
                    Controls.PaymentTerms__.SetCustomQuery();
                    Controls.LineItems__.InternalOrder__.SetCustomQuery();
                    Controls.LineItems__.WBSElement__.SetCustomQuery();
                    Controls.SAPPaymentMethod__.SetCustomQuery();
                    Controls.AlternativePayee__.SetCustomQuery();
                    Controls.BusinessArea__.SetCustomQuery();
                    Controls.LineItems__.BusinessArea__.SetCustomQuery();
                    Controls.LineItems__.TradingPartner__.SetCustomQuery();
                    Controls.ExtendedWithholdingTax__.WHTType__.SetCustomQuery();
                    Controls.ExtendedWithholdingTax__.WHTCode__.SetCustomQuery();
                }
                /** @this changeFilter */
                function changeFilter() {
                    this.SetFilter(Lib.AP.GetCustomFilterFromCrossCompanyCode(this.GetItem()));
                    return null;
                }
            }
            Browse.Init = Init;
            function GetSapConfig(forCtrl) {
                return sapConfigs[forCtrl];
            }
            Browse.GetSapConfig = GetSapConfig;
            function GetInvoiceDocument(callback, documentId, attributes) {
                var obj = Lib.AP.ParseInvoiceDocumentNumber(documentId, true);
                if (obj) {
                    var config = void 0, filter = void 0;
                    if (obj.isFI) {
                        config = sapConfigs.ForInvoiceFI;
                        filter = "(&(ERPInvoiceNumber__=" + obj.documentNumber + ")(FiscalYear__=" + obj.fiscalYear + ")(CompanyCode__=" + obj.companyCode + "))";
                    }
                    else {
                        config = sapConfigs.ForInvoiceMM;
                        filter = "(&(ERPMMInvoiceNumber__=" + obj.documentNumber + ")(FiscalYear__=" + obj.fiscalYear + "))";
                    }
                    if (!attributes) {
                        attributes = "CompanyCode__|VendorNumber__|ERPInvoiceNumber__|ERPMMInvoiceNumber__|InvoiceNumber__|FiscalYear__|InvoiceDate__|ERPPostingDate__|InvoiceAmount__|InvoiceCurrency__" +
                            "|DocumentType__|TaxAmount__|ERPPaymentBlocked__|BusinessArea__|Assignment__|InvoiceDescription__|BaselineDate__|PaymentTerms__|SAPPaymentMethod__" +
                            "|InvoiceReferenceNumber__|InvoiceReferenceFiscalYear__|HeaderText__|AlternativePayee__|WithholdingTax__";
                        if (!obj.isFI) {
                            attributes += "|UnplannedDeliveryCosts__|Investment__";
                        }
                        else {
                            attributes += "|AWTYP";
                        }
                    }
                    var fieldFormatters = Sys.Helpers.Extend({}, config.fieldFormatters, { InvoiceDate__: Sys.Helpers.Date.ShortDateStringToDate }, { ERPPostingDate__: Sys.Helpers.Date.ShortDateStringToDate }, { BaselineDate__: Sys.Helpers.Date.ShortDateStringToDate });
                    config = Sys.Helpers.Extend({}, config, {
                        useUserCultureForAmount: false,
                        fieldFormatters: fieldFormatters
                    });
                    Sys.ERP.SAP.Browse.SapQuery(function (queryResult) {
                        callback(queryResult, obj.isFI);
                    }, "Invoice", attributes, filter, null, 1, config);
                    return true;
                }
                return false;
            }
            Browse.GetInvoiceDocument = GetInvoiceDocument;
            function GetInvoiceItems(callback, documentId, attributes) {
                var obj = Lib.AP.ParseInvoiceDocumentNumber(documentId, true);
                if (!obj) {
                    return false;
                }
                var config, filter;
                if (obj.isFI) {
                    config = sapConfigs.ForInvoiceItemsFI;
                    filter = "(&(ERPInvoiceNumber__=" + obj.documentNumber + ")(FiscalYear__=" + obj.fiscalYear + ")(CompanyCode__=" + obj.companyCode + "))";
                }
                else {
                    config = sapConfigs.ForInvoiceItemsMM;
                    filter = "(&(ERPMMInvoiceNumber__=" + obj.documentNumber + ")(FiscalYear__=" + obj.fiscalYear + "))";
                }
                if (!attributes) {
                    attributes = "CompanyCode__|ERPInvoiceNumber__|ERPMMInvoiceNumber__|FiscalYear__|OrderNumber__|Description__" +
                        "|Quantity__|Amount__|TaxCode__|TaxJurisdiction__|TaxAmount__|GLAccount__|GLDescription__|CostCenter__|CCDescription__|BusinessArea__|Assignment__|InternalOrder__|WBSElement__|WBSElementID__";
                    if (obj.isFI) {
                        attributes += "|TradingPartner__";
                    }
                }
                function invoiceItemsCallback(queryResult) {
                    if (obj.isFI && !queryResult.GetQueryError() && queryResult.Records) {
                        // Amount__ is Net amount, WRBTR is amount plus tax
                        var iDefAmount_1 = queryResult.RecordsDefinition.Get("AMOUNT__");
                        var iDefTaxAmount_1 = queryResult.RecordsDefinition.Get("TAXAMOUNT__");
                        Sys.Helpers.Array.ForEach(queryResult.Records, function (record) {
                            record[iDefAmount_1] -= record[iDefTaxAmount_1];
                        });
                    }
                    callback(queryResult, obj.isFI);
                }
                Sys.ERP.SAP.Browse.SapQuery(invoiceItemsCallback, "Items", attributes, filter, null, 200, config);
                return true;
            }
            Browse.GetInvoiceItems = GetInvoiceItems;
            function GetWBSElementID(callback, companyCode, wbsElem) {
                if (!companyCode || !wbsElem) {
                    callback("");
                }
                else {
                    var filter = "(&(CompanyCode__=" + companyCode + ")(WBSElement__=" + wbsElem + "))";
                    if (Lib.P2P.Browse.GetBrowseERPName() === "SAP") {
                        Sys.ERP.SAP.Browse.SapQuery(function (queryResult) {
                            callback(queryResult.GetQueryError() ? null : queryResult.GetQueryValue("WBSElementID__", 0));
                        }, "WBSElement", "WBSElementID__", filter, null, 1, sapConfigs.ForWBSElement);
                    }
                    else {
                        callback("");
                    }
                }
            }
            Browse.GetWBSElementID = GetWBSElementID;
            function GetExtendedWithholdingTax(callback, fiDocumentId) {
                if (!fiDocumentId) {
                    fiDocumentId = Controls.ERPInvoiceNumber__.GetValue();
                }
                var obj = Lib.AP.ParseInvoiceDocumentNumber(fiDocumentId, true);
                if (obj) {
                    var filter = "(&(ERPInvoiceNumber__=" + obj.documentNumber + ")(FiscalYear__=" + obj.fiscalYear + ")(CompanyCode__=" + obj.companyCode + "))";
                    var attributes = "WHTType__|WHTCode__|WHTBaseAmount__|WHTTaxAmount__|WHTDescription__";
                    Sys.ERP.SAP.Browse.SapQuery(callback, null, attributes, filter, null, 200, sapConfigs.ForExtendedWHTItems);
                }
                else {
                    callback();
                }
            }
            Browse.GetExtendedWithholdingTax = GetExtendedWithholdingTax;
            function UpdateFieldsOnCrossCompanyCodeUpdate(cell) {
                Lib.AP.Browse.CleanLineItemOnCompanyCodeChange(cell);
                var cellRow = cell.GetRow();
                cellRow.GLAccount__.SetFilter(Lib.AP.GetCustomFilterFromCrossCompanyCode(cellRow.GLAccount__.GetItem()));
                cellRow.CostCenter__.SetFilter(Lib.AP.GetCustomFilterFromCrossCompanyCode(cellRow.CostCenter__.GetItem()));
                cellRow.WBSElement__.SetFilter(Lib.AP.GetCustomFilterFromCrossCompanyCode(cellRow.WBSElement__.GetItem()));
                cellRow.InternalOrder__.SetFilter(Lib.AP.GetCustomFilterFromCrossCompanyCode(cellRow.InternalOrder__.GetItem()));
            }
            Browse.UpdateFieldsOnCrossCompanyCodeUpdate = UpdateFieldsOnCrossCompanyCodeUpdate;
            function CleanLineItemOnCompanyCodeChange(cell) {
                var item = cell.GetRow().GetItem();
                item.SetValue("CostCenter__", "");
                item.SetValue("CCDescription__", "");
                item.SetValue("GLAccount__", "");
                item.SetValue("GLDescription__", "");
                item.SetValue("WBSElement__", "");
                item.SetValue("WBSElementID__", "");
                item.SetValue("TradingPartner__", "");
                item.SetValue("InternalOrder__", "");
                item.SetValue("BusinessArea__", "");
            }
            Browse.CleanLineItemOnCompanyCodeChange = CleanLineItemOnCompanyCodeChange;
        })(Browse = AP.Browse || (AP.Browse = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
