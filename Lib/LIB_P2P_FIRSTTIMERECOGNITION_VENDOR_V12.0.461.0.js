///#GLOBALS Lib
/* LIB_DEFINITION{
  "name": "Lib_P2P_FirstTimeRecognition_Vendor_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "P2P library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_IBAN",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_GenericAPI_Server",
    "Lib_P2P_V12.0.461.0",
    "LIB_AP_V12.0.461.0",
    "[Lib_P2P_Customization_FTRVendor]"
  ]
}*/
/**
 * @namespace Lib.P2P.FirstTimeRecognition_Vendor
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var FirstTimeRecognition_Vendor;
        (function (FirstTimeRecognition_Vendor) {
            // #region debug
            // Enable/disable debug mode
            var g_debug = false;
            // Enable/disable this very verbose mode for areas construction
            var g_debugAreas = false;
            function traceDebug(txt) {
                if (g_debug) {
                    Log.Info(txt);
                }
            }
            function traceDebugAreas(txt) {
                if (g_debugAreas) {
                    Log.Info(txt);
                }
            }
            /**
             * Handle the list of supported and available culture
             * @class CultureManager
             * @memberof Lib.P2P.FirstTimeRecognition_Vendor
             */
            var CultureManager = /** @class */ (function () {
                function CultureManager() {
                    /**
                     * The list of allowed ISO code for this document
                     * @member Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#m_availableCultures
                     * @private
                     * @type {string[]}
                     */
                    this.m_availableCultures = [];
                    /**
                     * The list of supported cultures
                     * @member Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#m_availableCultures
                     * @private
                     * @type {Lib.P2P.FirstTimeRecognition_Vendor.CultureInfo}
                     */
                    this.m_culturesInfo = {};
                    /**
                     * The current active culture for the document
                     * @member Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#activeCulture
                     * @public
                     * @type {Lib.P2P.FirstTimeRecognition_Vendor.CultureInfo}
                     */
                    this.activeCulture = null;
                    // Init manager
                    this.Init();
                }
                /**
                 * Initialize the culture manager. Calls the Lib.P2P.Customization.FTRVendor.GetCultureInfos user exit.
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#Init
                 * @public
                 */
                CultureManager.prototype.Init = function () {
                    this.m_availableCultures = [];
                    this.m_culturesInfo = {};
                    this.activeCulture = null;
                    var defaultCulture = this.GetDefaultSupportedCultures();
                    var supportedCultures = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.FTRVendor.GetCultureInfos", defaultCulture) || defaultCulture;
                    for (var culture in supportedCultures) {
                        if (Object.prototype.hasOwnProperty.call(supportedCultures, culture)) {
                            var cultureInfo = supportedCultures[culture];
                            this.m_culturesInfo[cultureInfo.name] = cultureInfo;
                        }
                    }
                    this.SetAvailableCultures();
                };
                /**
                 * List the default supported cultures
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetDefaultSupportedCultures
                 * @public
                 * @returns {Lib.P2P.FirstTimeRecognition_Vendor.CultureInfo[]}
                 */
                // eslint-disable-next-line class-methods-use-this
                CultureManager.prototype.GetDefaultSupportedCultures = function () {
                    return [
                        {
                            name: "en-US",
                            faxOrPhoneRegExp: /[0-9+\-()/ .]{9,}[0-9]/mg,
                            postalCodeRegExp: /[a-zA-Z]{2}(\.)?[ ]+[0-9]{5}(([ ]?-[ ]?[0-9]{4})|-)?/mg,
                            defaultCurrency: "USD",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Total Net Amount", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Grand Total"],
                            totalKeywordsSecondTry: ["Amount", "Total"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]o", "INVOICE [#]", "CREDIT MEMO", "Credit memo"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "de-DE",
                            VATRegExp: /((DE)?[ ]?\d{3}[ ]?\d{3}[ ]?\d{3})|((ATU)[ ]?\d{8})/mg,
                            faxOrPhoneRegExp: /((\+?(49))|0)[0-9\-()/ .]{2,}[0-9]/mg,
                            postalCodeRegExp: /\b(DE[- ])?\d{2}[ ]?\d{3}\b/mg,
                            defaultCurrency: "EUR"
                        },
                        {
                            name: "fr-BE",
                            VATRegExp: /(BE)?[. -]?[01]?\d{3}[. ]?\d{3}[. ]?\d{3}/mg,
                            faxOrPhoneRegExp: /((\+?(32))|0)[0-9\-()/ .]{9,}[0-9]/mg,
                            postalCodeRegExp: /[0-9]{4}/mg,
                            defaultCurrency: "EUR"
                        },
                        {
                            name: "fr-FR",
                            VATRegExp: /((FR)[ ]?(([0-9A-Z]?[ ]?){2}([0-9]{3}[ ]?){2})[0-9]{3})|((BE)0?[0-9]{3}[ .]?[0-9]{3}[ .]?[0-9]{3})/mg,
                            faxOrPhoneRegExp: /((\+?(33))|0)[0-9\-()/ .]{9,}[0-9]/mg,
                            postalCodeRegExp: /([ ]|$|^)([Ff]-)?[0-9]{2}[ ]?[0-9]{3}[ ]?/mg,
                            defaultCurrency: "EUR"
                        },
                        {
                            name: "en-GB",
                            VATRegExp: /(GB)?[ ]?(([0-9]{3}[ ]?[0-9]{4}[ ]?[0-9]{2}[ ]?([0-9]{3})?)|((GD)[ ]?[0-4][0-9]{2})|((HA)[ ]?[5-9][0-9]{2}))/mg,
                            faxOrPhoneRegExp: /((\+?(44))|0)[0-9\-()/ .]{9,}[0-9]/mg,
                            postalCodeRegExp: /[a-zA-Z]{1,2}[0-9]{1,2}[a-zA-Z]?[ ]?[0-9][a-zA-Z]{2}/mg,
                            defaultCurrency: "GBP",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-AU",
                            VATRegExp: /\b([0-9]{2}[ -]?[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{3}|[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{2})\b/mg,
                            faxOrPhoneRegExp: /((\+?(61))|0)[0-9\-()/ .]{8,}[0-9]\b/mg,
                            postalCodeRegExp: /\b(08[0-9]{2}|[1-8][0-9]{3})\b/mg,
                            defaultCurrency: "AUD",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-NZ",
                            VATRegExp: /\b[0-9]{2,3}[ -]?[0-9]{3}[ -]?[0-9]{3}\b/mg,
                            faxOrPhoneRegExp: /((\+?(64))|0)[0-9\-()/ .]{7,}[0-9]\b/mg,
                            postalCodeRegExp: /\b[0-9]{4}\b/mg,
                            defaultCurrency: "NZD",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-SG",
                            VATRegExp: /\b((T|M|MR)[-]?)?[0-9]{2}[-]?[0-9]{5}?[/]?[0-9]{2}[-]?[A-Z0-9]\b/mg,
                            faxOrPhoneRegExp: /(\+?65)[0-9\-()/ .]{7,}[0-9]\b/mg,
                            postalCodeRegExp: /\b[0-9]{6}\b/mg,
                            defaultCurrency: "SGD",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-TH",
                            VATRegExp: /\b[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{3}\b/mg,
                            faxOrPhoneRegExp: /((\+?(66))|0)[0-9\-()/ .]{7,}[0-9]\b/mg,
                            postalCodeRegExp: /\b[0-9]{5}\b/mg,
                            defaultCurrency: "THB",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-PH",
                            VATRegExp: /\b[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{3}\b/mg,
                            faxOrPhoneRegExp: /((\+?(63))|0)[0-9\-()/ .]{8,}[0-9]\b/mg,
                            postalCodeRegExp: /\b[0-9]{4}\b/mg,
                            defaultCurrency: "PHP",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-ID",
                            VATRegExp: /\b0[0-9][.]?[0-9]{3}[.]?[0-9]{3}[.]?[0-9][-][0-9][.]?[0-9]{3}[.]?00[0-9]\b/mg,
                            faxOrPhoneRegExp: /((\+?(62))|0)[0-9\-()/ .]{5,}[0-9]\b/mg,
                            postalCodeRegExp: /\b[0-9]{5}\b/mg,
                            defaultCurrency: "IDR",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "en-MY",
                            VATRegExp: /[0-9]{12}/mg,
                            faxOrPhoneRegExp: /(\+?60)[0-9\-()/ .]{7,}[0-9]\b/mg,
                            postalCodeRegExp: /[0-9]{6}/mg,
                            defaultCurrency: "MYR",
                            // Used in APv1 engine only
                            totalKeywordsFirstTry: ["TOTAL AMOUNT DUE", "Invoice Total", "Total amount", "AMOUNT DUE", "Total Due", "Gross Value", "Amount to pay", "Total amt", "Balance Due", "Total Value", "Grand Total"],
                            totalKeywordsSecondTry: ["Total", "Amount"],
                            invoiceNumberKeywordsFirstTry: ["Invoice Number", "Invoice [N]°", "Invoice [N]o", "INVOICE [#]", "TAX INVOICE", "Tax Invoice Number", "Inv Number", "Inv [N]o", "CREDIT MEMO", "Credit memo", "CREDIT NOTE", "Credit Note", "Credit note"],
                            invoiceNumberKeywordsSecondTry: ["INVOICE", "Number"],
                            invoiceNumberRegExp: /[A-Z0-9][0-9A-Z./-]*[0-9][0-9A-Z./-]*/mg,
                            invoicePORegExp: /4[59][0-9]{8}/mg
                        },
                        {
                            name: "es-ES",
                            VATRegExp: /(ES)[ ]?(([A-Z]\d{7}[A-Z0-9])|(\d{8}[A-Z]))/mg,
                            faxOrPhoneRegExp: /(T|F)?(\(?(\+?(34))|0)\)?[ ]?([0-9][ ]?){9}/mg,
                            postalCodeRegExp: /[0-9]{2}[ ]?[0-9]{3}/mg,
                            defaultCurrency: "EUR"
                        },
                        {
                            name: "it-IT",
                            VATRegExp: /[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}/mg,
                            faxOrPhoneRegExp: /((\+?(39))|0)[0-9\-()/ .]{9,}[0-9]/mg,
                            postalCodeRegExp: /\b([a-zA-Z]{2}[- ]?)?\d{2}[ ]?\d{3}\b/mg,
                            defaultCurrency: "EUR"
                        },
                        {
                            name: "jp-JP",
                            VATRegExp: /T\d{13}/mg,
                            faxOrPhoneRegExp: /^(\+81|0)((\d[ ]?-[ ]?\d{4})|(\d{2}[ ]?-[ ]?\d{3}))[ ]?-[ ]?\d{4}$/mg,
                            postalCodeRegExp: /[0-9]{3}[ ]?-[ ]?[0-9]{4}/mg,
                            defaultCurrency: "JPY"
                        },
                        {
                            name: "ko-KR",
                            VATRegExp: /((\d{3})[ ]?-[ ]?(\d{2})[ ]?-[ ]?(\d{5}))/mg,
                            faxOrPhoneRegExp: /^(\+82|0)\d{2}[ ]?-[ ]?(\d{3}|\d{4})[ ]?-[ ]?\d{4}$/mg,
                            postalCodeRegExp: /([0-2]{1})\d{4}/mg,
                            defaultCurrency: "KRW"
                        },
                        {
                            name: "nl-NL",
                            VATRegExp: /(NL)?[ ]?([0-9][ ]?){9}[ ]?B[ ]?([0-9][ ]?){2}/mg,
                            faxOrPhoneRegExp: /(T|F)?[ ]?((\+?(31))|0)\)?[ ]?[(]?0?[)]?[ ]?[ ]?([0-9]([ ]|[-])?){9}/mg,
                            postalCodeRegExp: /[0-9]{4}[ ]?[ ]?[a-zA-Z]{2}/mg,
                            defaultCurrency: "EUR"
                        }
                    ];
                };
                /**
                 * Give the current document culture or null if no culture set
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetCurrentDocumentCulture
                 * @public
                 * @returns {string} the culture use for the document
                 */
                CultureManager.prototype.GetCurrentDocumentCulture = function () {
                    if (this.activeCulture) {
                        return this.activeCulture.name;
                    }
                    return null;
                };
                /**
                 * Give the current document culture or null if no culture set
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#SetCurrentCulture
                 * @public
                 * @param {string} culture the culture to activate
                 */
                CultureManager.prototype.SetCurrentCulture = function (culture) {
                    this.activeCulture = this.m_culturesInfo[culture];
                };
                /**
                 * Give the current document culture or null if no culture set
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#SetCurrentDocumentCulture
                 * @public
                 * @param {string} culture the culture of the current document, if not available the first available on will be chosen.
                 */
                CultureManager.prototype.SetCurrentDocumentCulture = function (culture) {
                    if (this.m_availableCultures.indexOf(culture) !== -1) {
                        this.SetCurrentCulture(culture);
                    }
                    else {
                        this.SetCurrentCulture(this.m_availableCultures[0]);
                        Log.Warn("Chosen document culture is not among the available ones");
                    }
                };
                /**
                 * Set the list of available culture for the current document.
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#SetAvailableCultures
                 * @public
                 * @param {string|string[]} ac the culture or the list of culture available for the current document.
                 */
                CultureManager.prototype.SetAvailableCultures = function (ac) {
                    this.m_availableCultures = [];
                    if (Object.prototype.toString.call(ac) === "[object Array]" && ac.length > 0) {
                        this.m_availableCultures = ac;
                    }
                    else if (typeof ac === "string") {
                        this.m_availableCultures[0] = ac;
                    }
                    else {
                        this.m_availableCultures[0] = "en-US";
                    }
                    if (this.m_availableCultures.indexOf(this.GetCurrentDocumentCulture()) === -1) {
                        this.SetCurrentCulture(this.m_availableCultures[0]);
                    }
                };
                /**
                 * Allow to access to any property of the active CultureInfo
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetProperty
                 * @public
                 * @param {string} propertyName The name of the property to access on the activeCultureInfo (case-sensitive)
                 * @returns {string|number|boolean} The value of the property or null if the property is missing
                 */
                CultureManager.prototype.GetProperty = function (propertyName) {
                    if (this.activeCulture && propertyName) {
                        return this.activeCulture[propertyName] || null;
                    }
                    return null;
                };
                /**
                 * Returns the name of the active CultureInfo
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetCulture
                 * @public
                 * @returns {string} cuture name
                 */
                CultureManager.prototype.GetCulture = function () {
                    return this.GetProperty("name");
                };
                /**
                 * Returns the country of the active CultureInfo
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetCountry
                 * @public
                 * @returns {string} cuture country
                 */
                CultureManager.prototype.GetCountry = function () {
                    var culture = this.GetCulture();
                    if (culture) {
                        var country = culture.slice(culture.indexOf("-") + 1);
                        return country.toUpperCase();
                    }
                    return null;
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetVATRegExp
                 * @public
                 * @returns {RegExp}
                 */
                CultureManager.prototype.GetVATRegExp = function () {
                    return this.GetProperty("VATRegExp");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetFaxOrPhoneRegExp
                 * @public
                 * @returns {RegExp}
                 */
                CultureManager.prototype.GetFaxOrPhoneRegExp = function () {
                    return this.GetProperty("faxOrPhoneRegExp");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetPostalCodeRegExp
                 * @public
                 * @returns {RegExp}
                 */
                CultureManager.prototype.GetPostalCodeRegExp = function () {
                    return this.GetProperty("postalCodeRegExp");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetTotalKeywordsFirstTry
                 * @public
                 * @returns {string[]}
                 */
                CultureManager.prototype.GetTotalKeywordsFirstTry = function () {
                    return this.GetProperty("totalKeywordsFirstTry");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetTotalKeywordsSecondTry
                 * @public
                 * @returns {string[]}
                 */
                CultureManager.prototype.GetTotalKeywordsSecondTry = function () {
                    return this.GetProperty("totalKeywordsSecondTry");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetInvoiceNumberKeywordsFirstTry
                 * @public
                 * @returns {string[]}
                 */
                CultureManager.prototype.GetInvoiceNumberKeywordsFirstTry = function () {
                    return this.GetProperty("invoiceNumberKeywordsFirstTry");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetInvoiceNumberKeywordsSecondTry
                 * @public
                 * @returns {string[]}
                 */
                CultureManager.prototype.GetInvoiceNumberKeywordsSecondTry = function () {
                    return this.GetProperty("invoiceNumberKeywordsSecondTry");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetInvoiceNumberRegExp
                 * @public
                 * @returns {RegExp}
                 */
                CultureManager.prototype.GetInvoiceNumberRegExp = function () {
                    return this.GetProperty("invoiceNumberRegExp");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetInvoicePORegExp
                 * @public
                 * @returns {RegExp}
                 */
                CultureManager.prototype.GetInvoicePORegExp = function () {
                    return this.GetProperty("invoicePORegExp");
                };
                /**
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#GetDefaultCurrency
                 * @public
                 * @returns {string}
                 */
                CultureManager.prototype.GetDefaultCurrency = function () {
                    var extDefaultCurrency = Variable.GetValueAsString("DefaultCurrency");
                    return extDefaultCurrency ? extDefaultCurrency : this.GetProperty("defaultCurrency");
                };
                /**
                 * Normalize a phone or fax number
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#NormalizeTelInternal
                 * @private
                 * @param {string} tel the phone number
                 * @param {string} ext the international prefix
                 * @param {number} len the length of the phone number
                 * @returns {string} the normalized phone number
                 */
                CultureManager.NormalizeTelInternal = function (tel, ext, len) {
                    if (tel.indexOf("+") === 0 || tel.indexOf("0") === 0) {
                        tel = tel.substr(1);
                    }
                    if (tel.indexOf(ext) === 0 && tel.length > len) {
                        tel = tel.substr(ext.length);
                    }
                    if (tel.indexOf("0") === 0) {
                        tel = tel.substr(1);
                    }
                    if (tel.length !== len) {
                        return null;
                    }
                    tel = "+".concat(ext, " ").concat(tel);
                    return tel;
                };
                /**
                 * Normalize a phone or fax number in the current document culture
                 * @method Lib.P2P.FirstTimeRecognition_Vendor.CultureManager#NormalizeTel
                 * @public
                 * @param {string} tel the phone number
                 * @returns {string} the normalized phone number
                 */
                CultureManager.prototype.NormalizeTel = function (tel) {
                    var currentCulture = this.GetCurrentDocumentCulture();
                    if (currentCulture === "fr-FR") {
                        return CultureManager.NormalizeTelInternal(tel, "33", 9);
                    }
                    else if (currentCulture === "en-GB") {
                        return CultureManager.NormalizeTelInternal(tel, "44", 10);
                    }
                    else if (currentCulture === "en-US") {
                        return CultureManager.NormalizeTelInternal(tel, "1", 10);
                    }
                    return tel;
                };
                return CultureManager;
            }());
            // Define search options
            var optionsDefaultValues = {
                searchIBAN: true,
                searchVAT: true,
                searchPhoneOrFax: true,
                searchAddress: true,
                ownPhone: "",
                ownFax: "",
                ownVAT: ""
            };
            var options = Sys.Helpers.Clone(optionsDefaultValues);
            var lookupResults = {};
            var countriesCheckForIBAN = {};
            function Init() {
                options = Sys.Helpers.Clone(optionsDefaultValues);
                // Define search options
                if (Sys.Parameters.GetInstance("AP").GetParameter("FTRVendorOnIdentifiersOnly") === "1") {
                    options.searchAddress = false;
                }
                var companyCode = Data.GetValue("CompanyCode__");
                if (companyCode) {
                    var queryCallback = function (records, error) {
                        if (error) {
                            Log.Error(error);
                        }
                        else if (records && records.length > 0) {
                            options.ownPhone = records[0].PhoneNumber__;
                            options.ownFax = records[0].FaxNumber__;
                            options.ownVAT = records[0].VATNumber__;
                        }
                    };
                    var filter = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode).toString();
                    Sys.GenericAPI.Query("PurchasingCompanycodes__", filter, ["CompanyCode__", "PhoneNumber__", "FaxNumber__", "VATNumber__"], queryCallback, null, 1);
                }
                lookupResults = {};
                countriesCheckForIBAN = {};
            }
            FirstTimeRecognition_Vendor.Init = Init;
            // #region recognition engine
            function EnableDebug(enable) {
                g_debug = enable;
            }
            FirstTimeRecognition_Vendor.EnableDebug = EnableDebug;
            function GetLookupResults() {
                return lookupResults;
            }
            FirstTimeRecognition_Vendor.GetLookupResults = GetLookupResults;
            FirstTimeRecognition_Vendor.cultureManager = new CultureManager();
            function GetOptions() {
                return options;
            }
            FirstTimeRecognition_Vendor.GetOptions = GetOptions;
            // #endregion recognition engine
            // #region preview interaction
            /**
            * Select the best Area with the most matching words
            * @method GetBestMatchedArea
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {MatchingInfo[]} Array of matching information
            * @returns {MatchingInfo} the best selected area
            */
            function GetBestMatchedArea(areas) {
                var bestMatchIndex = -1;
                var maxMatchingWords = 0;
                for (var i = 0; i < areas.length; i++) {
                    var currentBlock = areas[i];
                    if (currentBlock.matchingWords > maxMatchingWords) {
                        maxMatchingWords = currentBlock.matchingWords;
                        bestMatchIndex = i;
                    }
                }
                return bestMatchIndex !== -1 ? areas[bestMatchIndex] : null;
            }
            FirstTimeRecognition_Vendor.GetBestMatchedArea = GetBestMatchedArea;
            // #endregion preview interaction
            // #region text helpers
            /**
            * Returns The top right word area from a given rectabgle
            * @method findTopRightWordInRect
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {number} iPage The current page number
            * @param {number} __iResX The initial X position
            * @param {number} __iResY The initial Y position
            * @param {number} __iResW the rectangle width
            * @returns {Area} The most top right word from the given position
            */
            function findTopRightWordInRect(iPage, __iResX, __iResY, __iResW) {
                var __areaCurrentWord = Document.GetWord(iPage, __iResX + __iResW, __iResY);
                var __iBreak = 0;
                while (__areaCurrentWord.x > __iResX + __iResW && __iBreak < 3) {
                    var __iCurX = __areaCurrentWord.x + __areaCurrentWord.width;
                    var tmpAreaPrevWord = Document.GetWord(iPage, __iCurX, __iResY);
                    var __areaPrevWord = tmpAreaPrevWord.GetPreviousWord();
                    if (__areaPrevWord.x === 0 || __areaPrevWord.x + __areaPrevWord.w < __iCurX) {
                        // next line
                        break;
                    }
                    __areaCurrentWord = __areaPrevWord;
                    __iBreak++;
                }
                return __areaCurrentWord;
            }
            FirstTimeRecognition_Vendor.findTopRightWordInRect = findTopRightWordInRect;
            /**
            * Expand the area to the right
            * @method enlargeToTheRight
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {number} iPage The current page number
            * @param {number} __iResX The initial X position
            * @param {number} __iResW The initial width
            * @param {number} __iResH The initial height
            * @param {number} maxX the maximum allowed to expand the area
            * @returns {Rect} The new area enclosing words on the right next to the initial area
            */
            function enlargeToTheRight(iPage, __iResX, __iResY, __iResW, __iResH, maxX) {
                var __areaCurrentWord = findTopRightWordInRect(iPage, __iResX, __iResY, __iResW);
                if (__areaCurrentWord.x !== 0) {
                    while (1) {
                        var __iOldX = __areaCurrentWord.x + __areaCurrentWord.width;
                        var tmpAreaNextWord = Document.GetWord(iPage, __iOldX, __iResY);
                        var __areaNextWord = tmpAreaNextWord.GetNextWord();
                        var __iNewX = __areaNextWord.x;
                        if (__iNewX !== 0 && __iNewX > __iOldX && __iNewX - __iOldX < maxX) {
                            traceDebugAreas("enlarged to right: __iNewX = ".concat(__iNewX, " __iOldX = ").concat(__iOldX));
                            __iResW = __iNewX + __areaNextWord.width - __iResX;
                            var __areaNewCurrentWord = Document.GetWord(iPage, __iResX + __iResW, __iResY);
                            if (__areaNewCurrentWord.x === __areaCurrentWord.x) {
                                traceDebugAreas("Could not advance to next word to the right. Stop here.");
                                break;
                            }
                            __areaCurrentWord = __areaNewCurrentWord;
                        }
                        else {
                            // Ensure the whole word lies within our rectangle
                            if (__iResX + __iResW < __iOldX) {
                                traceDebugAreas("current word not included into current rect. Forcing it.");
                                __iResW = __iOldX - __iResX;
                            }
                            break;
                        }
                    }
                    traceDebugAreas("1-resX = ".concat(__iResX, " & resW = ").concat(__iResW));
                }
                return { x: __iResX, y: __iResY, width: __iResW, height: __iResH };
            }
            FirstTimeRecognition_Vendor.enlargeToTheRight = enlargeToTheRight;
            /**
            * Returns The top left word area from a given position
            * @method findTopLeftWordInRect
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {number} iPage The current page number
            * @param {number} __iResX The initial X position
            * @param {number} __iResY The initial Y position
            * @returns {Area} The most top left word from the given position
            */
            function findTopLeftWordInRect(iPage, __iResX, __iResY) {
                var __areaCurrentWord = Document.GetWord(iPage, __iResX, __iResY);
                var __iBreak = 0;
                while (__areaCurrentWord.x > __iResX && __iBreak < 3) {
                    var tmpAreaNextWord = Document.GetWord(iPage, __areaCurrentWord.x, __iResY);
                    var __areaNextWord = tmpAreaNextWord.GetNextWord();
                    if (__areaNextWord.x === 0 ||
                        (__areaNextWord.x < __areaCurrentWord.x ||
                            __areaNextWord.y > __areaCurrentWord.y + __areaCurrentWord.height)) {
                        // Next line
                        break;
                    }
                    __areaCurrentWord = __areaNextWord;
                    __iBreak++;
                }
                return __areaCurrentWord;
            }
            FirstTimeRecognition_Vendor.findTopLeftWordInRect = findTopLeftWordInRect;
            /**
            * Expand the area to the left
            * @method enlargeToTheLeft
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {number} iPage The current page number
            * @param {number} __iResX The initial X position
            * @param {number} __iResW The initial width
            * @param {number} __iResH The initial height
            * @param {number} maxX the maximum allowed to expand the area
            * @returns {Rect} The new area enclosing words on the left next to the initial area
            */
            function enlargeToTheLeft(iPage, __iResX, __iResY, __iResW, __iResH, maxX) {
                var __areaCurrentWord = findTopLeftWordInRect(iPage, __iResX, __iResY);
                if (__areaCurrentWord.x !== 0) {
                    traceDebugAreas("Before Loop 2");
                    while (1) {
                        var __areaPrevWord = __areaCurrentWord.GetPreviousWord();
                        var __iNewX = __areaPrevWord.x + __areaPrevWord.width;
                        if (__iNewX !== 0 && __iNewX < __iResX && __iResX - __iNewX < maxX) {
                            traceDebugAreas("enlarged to left: __iNewX = ".concat(__iNewX, " iResX = ").concat(__iResX));
                            __iResW += __iResX - __areaPrevWord.x;
                            __iResX = __areaPrevWord.x;
                            __areaCurrentWord = __areaPrevWord;
                        }
                        else {
                            break;
                        }
                    }
                }
                return { x: __iResX, y: __iResY, width: __iResW, height: __iResH };
            }
            FirstTimeRecognition_Vendor.enlargeToTheLeft = enlargeToTheLeft;
            /**
            * Enlarge the area to enclose around words in the resulting area
            * @method getTextAroundWord
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {number} iPage The current page number
            * @param {number} __iResX The initial X position
            * @param {number} __iResW The initial width
            * @param {number} __iResH The initial height
            * @returns {Area} The new area enclosing words next to the initial area
            */
            function getTextAroundWord(iPage, __iResX, __iResY, __iResW, __iResH) {
                // Max Block address lines
                var maxLines = 7;
                // Tolerances when enlarging block address between two words
                // maxX ~= 0.75cm
                var maxX = Document.GetPageResolutionX(iPage) * 0.75 / 2.54;
                // maxY ~= 0.5cm
                var maxY = Document.GetPageResolutionY(iPage) * 0.5 / 2.54;
                traceDebugAreas("__maxX=".concat(maxX, " & __maxY=").concat(maxY));
                var nbLines = 0;
                while (nbLines < maxLines) {
                    var enlargeRight = enlargeToTheRight(iPage, __iResX, __iResY, __iResW, __iResH, maxX);
                    var enlargeLeft = enlargeToTheLeft(iPage, enlargeRight.x, enlargeRight.y, enlargeRight.width, enlargeRight.height, maxX);
                    __iResX = enlargeLeft.x;
                    __iResY = enlargeLeft.y;
                    __iResW = enlargeLeft.width;
                    __iResH = enlargeLeft.height;
                    traceDebugAreas("2-resX = ".concat(__iResX, "  resW = ").concat(__iResW, "  __iResY = ").concat(__iResY, "  __iResH = ").concat(__iResH));
                    // enlrge to the top: look for the nearest word on the left, middle and right of the top of the block address (this will solve text alignement problem)
                    var prevLine = void 0;
                    var zoneBlockAdressToLeft = Document.GetWord(iPage, __iResX, __iResY);
                    var zoneBlockAdressToMiddle = Document.GetWord(iPage, __iResX + (__iResW / 2), __iResY);
                    var zoneBlockAdressToRight = Document.GetWord(iPage, __iResX + __iResW, __iResY);
                    var prevLineLeft = zoneBlockAdressToLeft.GetWordAbove();
                    var prevLineMiddle = zoneBlockAdressToMiddle.GetWordAbove();
                    var prevLineRight = zoneBlockAdressToRight.GetWordAbove();
                    var iYLeft = prevLineLeft.y + prevLineLeft.height;
                    var iYMiddle = prevLineMiddle.y + prevLineMiddle.height;
                    var iYRight = prevLineRight.y + prevLineRight.height;
                    if (iYLeft >= __iResY) {
                        iYLeft = 0;
                    }
                    if (iYMiddle >= __iResY) {
                        iYMiddle = 0;
                    }
                    if (iYRight >= __iResY) {
                        iYRight = 0;
                    }
                    // Take the closest
                    if (iYLeft > iYMiddle) {
                        if (iYLeft > iYRight) {
                            prevLine = prevLineLeft;
                        }
                        else {
                            prevLine = prevLineRight;
                        }
                    }
                    else if (iYMiddle > iYRight) {
                        prevLine = prevLineMiddle;
                    }
                    else {
                        prevLine = prevLineRight;
                    }
                    var __iNewY = prevLine.y + prevLine.height;
                    if (__iNewY !== 0 && __iNewY < __iResY && __iResY - __iNewY < maxY) {
                        __iResH += __iResY - prevLine.y;
                        __iResY = prevLine.y;
                        traceDebugAreas("enlarged to top, newResH=".concat(__iResH));
                        nbLines++;
                    }
                    else {
                        traceDebugAreas("Stopped enlarging to top, __iNewY=".concat(__iNewY, " __iResY=").concat(__iResY));
                        break;
                    }
                }
                traceDebugAreas("final area: __iResX=".concat(__iResX, " __iResY=").concat(__iResY, " __iResW=").concat(__iResW, " __iResH=").concat(__iResH));
                var zoneBlockAdress = Document.GetArea(iPage, __iResX, __iResY, __iResW, __iResH);
                return zoneBlockAdress;
            }
            FirstTimeRecognition_Vendor.getTextAroundWord = getTextAroundWord;
            /**
            * Filter a string from a string of forbidden characters
            * @method spanExcluding
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {string} string The input string to clean
            * @param {string} span Forbidden characters
            * @returns {string} The input string filtered excluding all characters whithin the span string
            */
            function spanExcluding(string, span) {
                var res = "";
                for (var i = 0; i < string.length; i++) {
                    if (span.indexOf(string[i]) === -1) {
                        res += string[i];
                    }
                }
                return res;
            }
            FirstTimeRecognition_Vendor.spanExcluding = spanExcluding;
            /**
            * Filter a string from a string of allowed characters
            * @method spanIncluding
            * @memberof Lib.P2P.FirstTimeRecognition_Vendor
            * @param {string} string The input string to clean
            * @param {string} span Allowed characters
            * @returns {string} The input string filtered with only allowed characters from span string
            */
            function spanIncluding(string, span) {
                var res = "";
                for (var i = 0; i < string.length; i++) {
                    if (span.indexOf(string[i]) !== -1) {
                        res += string[i];
                    }
                }
                return res;
            }
            FirstTimeRecognition_Vendor.spanIncluding = spanIncluding;
            // #endregion text helpers
            // #region lookup functions
            /* Helper for vendorLookupFTSIBAN
                *	Look for some IBAN numbers
                *	and perform a Full Text Search Query in the AP - Vendor__ table
                */
            function vendorLookupFTSIBAN(companyCode, invoiceDocument, filterToAdd) {
                var result = { dbresult: null, areas: [] };
                var IBANRegExp = Sys.Helpers.Iban.GetValidationRegexp(null, "img"); // if we don't pass country array -> request all countries
                if (!IBANRegExp) {
                    return result;
                }
                function getVendorInfosFromVendorNumber(vendorNumber, iban) {
                    if (vendorNumber) {
                        var queryCallback = function (records, error) {
                            if (error) {
                                Log.Error(error);
                            }
                            else if (records && records.length > 0) {
                                result.dbresult = records[0];
                                result.areas.push(objMatchingInfos[iban]);
                            }
                        };
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(filterToAdd, Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber)).toString();
                        if (!Sys.Helpers.IsEmpty(companyCode)) {
                            filter = filter.AddCompanyCodeFilter(companyCode);
                        }
                        Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, Lib.AP.GetExtendedVendorAttributes(), queryCallback, null, 1);
                    }
                    else {
                        result.areas.push(objMatchingInfos[documentIBANList[0]]);
                    }
                }
                var documentIBANList = [];
                var objMatchingInfos = {};
                for (var iPage = 0; iPage < Document.GetPageCount(); iPage++) {
                    var pageText = Document.GetArea(iPage).toString();
                    var arrayIBAN = IBANRegExp.exec(pageText);
                    while (arrayIBAN) {
                        traceDebug("Found IBAN: ".concat(arrayIBAN[0]));
                        var word = spanIncluding(arrayIBAN[0], "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                        documentIBANList.push(word);
                        objMatchingInfos[word] = {
                            zone: Document.SearchString(arrayIBAN[0], iPage, true, false)[0],
                            matchingWords: 1,
                            value: word
                        };
                        arrayIBAN = IBANRegExp.exec(pageText);
                    }
                }
                if (documentIBANList.length === 0) {
                    return result;
                }
                if (invoiceDocument && Sys.Helpers.IsFunction(invoiceDocument.GetFirstVendorNumberFromIBANS)) {
                    invoiceDocument.GetFirstVendorNumberFromIBANS({ companyCode: companyCode, ibans: documentIBANList }, getVendorInfosFromVendorNumber);
                }
                else {
                    Lib.P2P.FirstTimeRecognition_Vendor.getFirstVendorNumberFromIBANS({ companyCode: companyCode, ibans: documentIBANList }, getVendorInfosFromVendorNumber);
                }
                return result;
            }
            FirstTimeRecognition_Vendor.vendorLookupFTSIBAN = vendorLookupFTSIBAN;
            /**
             * Found vendor number based on IBANS informations
             * @param {Object} parameters Informations about the vendor
             * @param {string} parameters.companyCode
             * @param {string[]} parameters.ibans
             * @param {function} resultCallback Callback to call to fill the result table
             */
            function getFirstVendorNumberFromIBANS(parameters, resultCallback) {
                var _a;
                function bankDetailsCallBack(results, error) {
                    if (error) {
                        Log.Error(error);
                    }
                    else if (results && results.length > 0) {
                        resultCallback(results[0].VendorNumber__, results[0].IBAN__);
                        return;
                    }
                    resultCallback();
                }
                if (parameters.ibans && parameters.ibans.length >= 1) {
                    var table = "AP - Bank details__";
                    var attributesList = ["VendorNumber__", "IBAN__"];
                    var sortOrder = "CompanyCode__ DESC,BankCountry__ ASC,BankName__ ASC,";
                    var filter = Sys.Helpers.LdapUtil.FilterAnd((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, parameters.ibans.map(function (iban) { return Sys.Helpers.LdapUtil.FilterEqual("IBAN__", iban); })), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", parameters.companyCode)).toString();
                    Sys.GenericAPI.Query(table, filter, attributesList, bankDetailsCallBack, sortOrder);
                }
                else {
                    bankDetailsCallBack();
                }
            }
            FirstTimeRecognition_Vendor.getFirstVendorNumberFromIBANS = getFirstVendorNumberFromIBANS;
            /* Helper for vendorLookupFTSVAT
                *	Look for some VAT numbers
                *	and perform a Full Text Search Query in the AP - Vendor__ table
                */
            function vendorLookupFTSVAT(companyCode, invoiceDocument, filterToAdd) {
                var _a;
                var VATCodeRegExp = FirstTimeRecognition_Vendor.cultureManager.GetProperty("VATRegExp");
                var documentWordsList = [];
                var result = { dbresult: null, areas: [] };
                if (!VATCodeRegExp) {
                    return result;
                }
                var ownNormalizedVAT = spanIncluding(options.ownVAT, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                for (var iPage = 0; iPage < Document.GetPageCount(); iPage++) {
                    var pageText = Document.GetArea(iPage).toString();
                    var arrayVATCode = VATCodeRegExp.exec(pageText);
                    while (arrayVATCode) {
                        traceDebug("\"Found VATCode: ".concat(arrayVATCode[0]));
                        var word = spanIncluding(arrayVATCode[0], "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                        if (word !== ownNormalizedVAT) {
                            documentWordsList.push(word);
                            var objMatchingInfo = {
                                zone: Document.SearchString(arrayVATCode[0], iPage, true, false)[0],
                                columns: ["VATNumber__"],
                                value: word
                            };
                            result.areas.push(objMatchingInfo);
                        }
                        arrayVATCode = VATCodeRegExp.exec(pageText);
                    }
                }
                if (documentWordsList.length === 0) {
                    return result;
                }
                var searchCriteria = [];
                for (var _i = 0, documentWordsList_1 = documentWordsList; _i < documentWordsList_1.length; _i++) {
                    var word = documentWordsList_1[_i];
                    if (word.length > 0) {
                        searchCriteria.push(Sys.Helpers.LdapUtil.FilterEqual("VATNumber__", word));
                    }
                }
                if (searchCriteria.length === 0) {
                    Log.Warn("Filter to query vendors with VAT is built with wrong arguments");
                }
                var filter = Sys.Helpers.LdapUtil.FilterAnd(filterToAdd, (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, searchCriteria)).toString();
                if (!Sys.Helpers.IsEmpty(companyCode)) {
                    filter = filter.AddCompanyCodeFilter(companyCode);
                }
                traceDebug("Filter to query vendors with VAT=".concat(filter));
                Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, Lib.AP.GetExtendedVendorAttributes(), function (records, error) {
                    if (error) {
                        Log.Error(error);
                    }
                    else if (!records || records.length === 0) {
                        return;
                    }
                    for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                        var record = records_1[_i];
                        // Validate this matching record
                        if (validateVendorRecordForVATPhoneOrFax(record, result.areas)) {
                            result.dbresult = record;
                            break;
                        }
                        else {
                            traceDebug("Discarding invalid value");
                        }
                    }
                });
                return result;
            }
            FirstTimeRecognition_Vendor.vendorLookupFTSVAT = vendorLookupFTSVAT;
            /* Helper for vendorLookupFTSPhoneOrFax
                *	Look for some Telephone and Fax
                *	and perform a Full Text Search Query in the AP - Vendor__ table
                */
            function vendorLookupFTSPhoneOrFax(companyCode, invoiceDocument, filterToAdd) {
                var _a;
                var faxOrTelRegExp = FirstTimeRecognition_Vendor.cultureManager.GetProperty("faxOrPhoneRegExp");
                var documentWordsList = [];
                var result = {
                    dbresult: null,
                    areas: []
                };
                if (!faxOrTelRegExp) {
                    return result;
                }
                var ownNormalizedPhone = FirstTimeRecognition_Vendor.cultureManager.NormalizeTel(spanIncluding(options.ownPhone, "+0123456789"));
                var ownNormalizedFax = FirstTimeRecognition_Vendor.cultureManager.NormalizeTel(spanIncluding(options.ownFax, "+0123456789"));
                for (var iPage = 0; iPage < Document.GetPageCount(); iPage++) {
                    // If nothing found, look for Tel or Fax
                    var pageText = Document.GetArea(iPage).toString();
                    var arrayTelOrFax = faxOrTelRegExp.exec(pageText);
                    while (arrayTelOrFax) {
                        traceDebug("Found Tel or Fax: ".concat(arrayTelOrFax[0]));
                        var word = FirstTimeRecognition_Vendor.cultureManager.NormalizeTel(spanIncluding(arrayTelOrFax[0], "+0123456789"));
                        if (word && (word !== ownNormalizedPhone) && (word !== ownNormalizedFax)) {
                            documentWordsList.push(word);
                            var objMatchingInfo = {
                                zone: Document.SearchString(arrayTelOrFax[0], iPage, true, false)[0],
                                columns: ["PhoneNumber__", "FaxNumber__"],
                                value: word
                            };
                            result.areas.push(objMatchingInfo);
                        }
                        arrayTelOrFax = faxOrTelRegExp.exec(pageText);
                    }
                }
                if (documentWordsList.length === 0) {
                    return result;
                }
                var searchCriteria = [];
                for (var _i = 0, documentWordsList_2 = documentWordsList; _i < documentWordsList_2.length; _i++) {
                    var word = documentWordsList_2[_i];
                    if (word.length > 0) {
                        searchCriteria.push(Sys.Helpers.LdapUtil.FilterEqual("PhoneNumber__", word));
                        searchCriteria.push(Sys.Helpers.LdapUtil.FilterEqual("FaxNumber__", word));
                    }
                }
                if (searchCriteria.length === 0) {
                    Log.Warn("Filter to query vendors with Phone or Fax is built with wrong arguments");
                }
                var filter = Sys.Helpers.LdapUtil.FilterAnd(filterToAdd, (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, searchCriteria)).toString();
                if (!Sys.Helpers.IsEmpty(companyCode)) {
                    filter = filter.AddCompanyCodeFilter(companyCode);
                }
                traceDebug("Filter to query vendors with Phone or Fax: ".concat(filter));
                Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, Lib.AP.GetExtendedVendorAttributes(), function (records, error) {
                    if (error) {
                        Log.Error(error);
                    }
                    else if (!records || records.length === 0) {
                        return;
                    }
                    for (var _i = 0, records_2 = records; _i < records_2.length; _i++) {
                        var record = records_2[_i];
                        // Validate this matching record
                        if (validateVendorRecordForVATPhoneOrFax(record, result.areas)) {
                            result.dbresult = record;
                            break;
                        }
                        else {
                            traceDebug("Discarding invalid value");
                        }
                    }
                });
                return result;
            }
            FirstTimeRecognition_Vendor.vendorLookupFTSPhoneOrFax = vendorLookupFTSPhoneOrFax;
            /* Helper for vendorLookupFTSPostal
             *	Look for some Postal Codes using a regular expression,
             *	and enlarge the zone around the Postal Code to extract a Block Address
             *	These Block Addresses will be used to perform a Full Text Search Query in the AP - Vendor__ table
             */
            function vendorLookupFTSPostal(companyCode, invoiceDocument, filterToAdd) {
                var result = { dbresult: null, areas: [] };
                if (!FirstTimeRecognition_Vendor.cultureManager.GetProperty("postalCodeRegExp")) {
                    return result;
                }
                var addressObject = lookupBlockAddressInDocument();
                result.areas = addressObject.blockAddressArray;
                if (addressObject.documentWordsList.length === 0) {
                    return result;
                }
                var wordsToSearchNoShortWords = addressObject.documentWordsList.filter(function checkIfWordLengthIsGreaterThan2(word) {
                    var isWordLengthGreaterThan2 = word.length >= 2;
                    if (isWordLengthGreaterThan2 === false) {
                        traceDebug("Discarding small value: ".concat(word));
                    }
                    return isWordLengthGreaterThan2;
                });
                var wordsToSearchNoDuplicates = wordsToSearchNoShortWords.filter(function checkIfWordIsADuplicate(word, index) {
                    var isWordOcurrenceFirstInArray = wordsToSearchNoShortWords.indexOf(word) === index;
                    if (isWordOcurrenceFirstInArray === false) {
                        traceDebug("Discarding duplicate value: ".concat(word));
                    }
                    return isWordOcurrenceFirstInArray;
                });
                var filterFTS = null;
                if (wordsToSearchNoDuplicates.length !== 0) {
                    var wordsToSearchEscaped = wordsToSearchNoDuplicates.map(function escapeWord(word) {
                        return Sys.Helpers.String.EscapeValueForLdapFilter(word);
                    });
                    filterFTS = "$Content$%=CONTAINS('ISABOUT(\"".concat(wordsToSearchEscaped.join('", "'), "\")')");
                    if (filterToAdd) {
                        filterFTS = "(&(".concat(filterFTS, ")(").concat(filterToAdd, "))");
                    }
                    if (!Sys.Helpers.IsEmpty(companyCode)) {
                        filterFTS = filterFTS.AddCompanyCodeFilter(companyCode);
                    }
                }
                traceDebug("\"Filter to query vendors with Postal codes: ".concat(filterFTS));
                Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filterFTS, Lib.AP.GetExtendedVendorAttributes(), function (records, error) {
                    if (error) {
                        Log.Error(error);
                    }
                    else if (!records || records.length === 0) {
                        return;
                    }
                    for (var _i = 0, records_3 = records; _i < records_3.length; _i++) {
                        var record = records_3[_i];
                        // Validate this matching record
                        if (validateVendorRecordForPostalAddress(record, result.areas)) {
                            result.dbresult = record;
                            break;
                        }
                        else {
                            traceDebug("Discarding invalid value");
                        }
                    }
                });
                return result;
            }
            FirstTimeRecognition_Vendor.vendorLookupFTSPostal = vendorLookupFTSPostal;
            function lookupBlockAddressInDocument() {
                var postalCodeRegExp = FirstTimeRecognition_Vendor.cultureManager.GetProperty("postalCodeRegExp");
                var postalCodeArray;
                // FTS Query will contain only words bigger than this Length
                var minWordLength = 2;
                // Limit the count of blockaddresses to look for
                var maxBlockAddressCount = 5;
                // Our Words-to-look-for list
                var documentWordsList = [];
                var blockAddressArray = [];
                var pageText = null;
                function loopOnPostalCodeZone(iPage, zoneBlockAdress) {
                    var __iResX = zoneBlockAdress.x;
                    var __iResY = zoneBlockAdress.y;
                    var __iResW = zoneBlockAdress.width;
                    var __iResH = zoneBlockAdress.height;
                    zoneBlockAdress = getTextAroundWord(iPage, __iResX, __iResY, __iResW, __iResH);
                    __iResX = zoneBlockAdress.x;
                    __iResY = zoneBlockAdress.y;
                    __iResW = zoneBlockAdress.width;
                    __iResH = zoneBlockAdress.height;
                    var address = zoneBlockAdress.toString();
                    traceDebugAreas("Analysing address: ".concat(address.toString()));
                    var isBlockComputed = false;
                    // Check if there is a single line
                    if (address.search(/\r/g) === -1 && address.search(/\n/g) === -1) {
                        traceDebugAreas("not enough lines for Postal Code: ".concat(address));
                        var originalAreaText = Document.GetArea(iPage, __iResX, __iResY, __iResW, __iResH).toString();
                        if (originalAreaText === address) {
                            // Could not find more than the Postal Code. Force to take the previous word on the left, as far as it is
                            traceDebugAreas("Forcing to enlarge on the left");
                            var tmpAreaPrevWord = Document.GetWord(iPage, __iResX, __iResY);
                            var __areaPrevWord = tmpAreaPrevWord.GetPreviousWord();
                            var __iNewX = __areaPrevWord.x + __areaPrevWord.w;
                            if (__iNewX !== 0 && __iNewX < __iResX) {
                                traceDebugAreas("Forced to enlarge on the left");
                                __iResW += __iResX - __areaPrevWord.x;
                                __iResX = __areaPrevWord.x;
                                __iResY = zoneBlockAdress.y;
                                __iResH = zoneBlockAdress.height;
                                zoneBlockAdress = getTextAroundWord(iPage, __iResX, __iResY, __iResW, __iResH);
                                __iResX = zoneBlockAdress.x;
                                __iResY = zoneBlockAdress.y;
                                __iResW = zoneBlockAdress.width;
                                __iResH = zoneBlockAdress.height;
                                address = zoneBlockAdress.toString();
                                var withoutCR = address.split("\\n");
                                isBlockComputed = withoutCR.length > 1;
                            }
                        }
                        else {
                            __iResX = zoneBlockAdress.x;
                        }
                        if (!isBlockComputed) {
                            // Enlarge to the top, until the first word
                            traceDebugAreas("Forcing to enlarge on the top");
                            var prevLineToLeft = Document.GetWord(iPage, __iResX, __iResY);
                            var areaPrevLine = prevLineToLeft.GetWordAbove();
                            var __iNewY = areaPrevLine.y + areaPrevLine.height;
                            traceDebugAreas("DEBUG iX=".concat(__iResX, " iY=").concat(__iResY));
                            traceDebugAreas("Prev Line X=".concat(areaPrevLine.x, " Y=").concat(areaPrevLine.y, " W=").concat(areaPrevLine.width, " H=").concat(areaPrevLine.height));
                            traceDebugAreas("WORD ABOVE: ".concat(areaPrevLine.toString()));
                            traceDebugAreas("TEST NewY=".concat(__iNewY, " ResY=").concat(__iResY));
                            if (__iNewY !== 0 && __iNewY < __iResY) {
                                traceDebugAreas("Forced to enlarged on the top");
                                __iResH += __iResY - areaPrevLine.y;
                                __iResY = areaPrevLine.y;
                                zoneBlockAdress = getTextAroundWord(iPage, __iResX, __iResY, __iResW, __iResH);
                            }
                        }
                    }
                    address = zoneBlockAdress.toString();
                    traceDebugAreas("Step 2 Analysing address: ".concat(address));
                    // Change CRLF to spaces
                    address = address.replace(/$/g, " ");
                    address = address.replace(/\r/g, " ");
                    address = address.replace(/\n/g, " ");
                    address = address.replace(/\t/g, " ");
                    address = address.replace(",", " ");
                    address = spanExcluding(address, "/\\&<>'\".:~{}");
                    // And split the block address in Words
                    var words = address.split(" ");
                    var wordsList = [];
                    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
                        var word = words_1[_i];
                        if (word.length >= minWordLength) {
                            // Check if already inserted in our word-to-look list
                            var bIsNew = documentWordsList.indexOf(word) === -1;
                            if (bIsNew) {
                                documentWordsList.push(word);
                                wordsList.push(word);
                            }
                            else {
                                var bIsNewInBlock = wordsList.indexOf(word) === -1;
                                if (bIsNewInBlock) {
                                    wordsList.push(word);
                                }
                            }
                        }
                    }
                    address = wordsList.join(" ");
                    var objMatchingInfo = {
                        zone: zoneBlockAdress,
                        columns: ["PostalCode__", "Street__", "Region__", "City__", "Name__"],
                        lookupText: [
                            address,
                            address,
                            address,
                            address,
                            address
                        ]
                    };
                    blockAddressArray.push(objMatchingInfo);
                }
                function loopOnPostalCode(iPage) {
                    // Lookup this text in the document
                    traceDebugAreas("Current Postal Code: ".concat(postalCodeArray[0]));
                    var zonePostalCode = Document.SearchString(postalCodeArray[0], iPage, true, false);
                    var iPostalCode = 0;
                    if (zonePostalCode) {
                        while (iPostalCode < zonePostalCode.length && blockAddressArray.length < maxBlockAddressCount) {
                            var zoneBlockAdress = zonePostalCode[iPostalCode++];
                            loopOnPostalCodeZone(iPage, zoneBlockAdress);
                        }
                    }
                    postalCodeArray = postalCodeRegExp.exec(pageText);
                }
                for (var iPage = 0; iPage < Document.GetPageCount() && blockAddressArray.length < maxBlockAddressCount; iPage++) {
                    pageText = Document.GetArea(iPage).toString();
                    traceDebugAreas("\"Current page: ".concat(iPage));
                    postalCodeArray = postalCodeRegExp.exec(pageText);
                    while (postalCodeArray && blockAddressArray.length < maxBlockAddressCount) {
                        loopOnPostalCode(iPage);
                    }
                    traceDebugAreas("postalCodeArray Finished");
                }
                return { documentWordsList: documentWordsList, blockAddressArray: blockAddressArray };
            }
            FirstTimeRecognition_Vendor.lookupBlockAddressInDocument = lookupBlockAddressInDocument;
            // #endregion lookup functions
            /* Helper for validateVendorRecordForVATPhoneOrFax
                * Check that the data have been found in the correct columns
                * arrayObjMatchingInfo contains the zones we're looking for.
                * It must be an array of objects containing:
                *	- zone: the zone where the text was found
                *	- columns: array of column names which should match
                *	- value: value of the field in the document which will be compared to database value
                */
            function validateVendorRecordForVATPhoneOrFax(record, arrayObjMatchingInfo) {
                traceDebug("ValidateRecordForVATPhoneOrFax - msn='".concat(record.msn, "'"));
                // For each block containing text
                for (var _i = 0, arrayObjMatchingInfo_1 = arrayObjMatchingInfo; _i < arrayObjMatchingInfo_1.length; _i++) {
                    var block = arrayObjMatchingInfo_1[_i];
                    traceDebug("Evaluating block: '".concat(block.value, "'"));
                    // For each Column possible for that query
                    for (var _a = 0, _b = block.columns; _a < _b.length; _a++) {
                        var colName = _b[_a];
                        // Verify that the requested text has been found in one of these columns
                        var colValue = record[colName].toLowerCase();
                        if (colValue === block.value.toLowerCase()) {
                            traceDebug("Found matching Word - Doc='".concat(block.value, "' DB='").concat(colValue, "' in '").concat(colName, "'"));
                            block.matchingWords = 1;
                            return true;
                        }
                    }
                }
                return false;
            }
            FirstTimeRecognition_Vendor.validateVendorRecordForVATPhoneOrFax = validateVendorRecordForVATPhoneOrFax;
            /* Helper for validateVendorRecordForPostalAddress
                *	Check that the data have been found in the correct columns
                *	arrayObjMatchingInfo contains the zones we're looking for.
                *	It must be an array of objects containing:
                *	- zone: the zone where the text was found
                *	- columns: array of column names which should match
                *	- lookupText: array of text corresponding to the columns
                */
            function validateVendorRecordForPostalAddress(record, arrayObjMatchingInfo) {
                var isValidRecord = false;
                var minRequiredMatchingWords = 2;
                traceDebug("ValidateRecordForPostalAddress - msn='".concat(record.msn, "'"));
                // For each block containing text
                for (var _i = 0, arrayObjMatchingInfo_2 = arrayObjMatchingInfo; _i < arrayObjMatchingInfo_2.length; _i++) {
                    var block = arrayObjMatchingInfo_2[_i];
                    var matchingWords = 0;
                    traceDebug("Evaluating block: '".concat(block.lookupText[0], "'"));
                    // For each Column possible for that query
                    for (var j = 0; j < block.columns.length; j++) {
                        // Verify that the requested text has been found in one of these columns
                        var colName = block.columns[j];
                        var colValue = record[colName].toLowerCase();
                        var arrayLookupText = block.lookupText[j].split(" ");
                        for (var _a = 0, arrayLookupText_1 = arrayLookupText; _a < arrayLookupText_1.length; _a++) {
                            var candidate = arrayLookupText_1[_a];
                            if (candidate.length > 0 && colValue.indexOf(candidate.toLowerCase()) !== -1) {
                                traceDebug("Found matching Word - Doc='".concat(candidate, "' DB='").concat(colValue, "' in '").concat(colName, "'"));
                                matchingWords++;
                            }
                        }
                    }
                    block.matchingWords = matchingWords;
                    isValidRecord = isValidRecord || matchingWords >= minRequiredMatchingWords;
                    traceDebug("Block score: ".concat(matchingWords, " (Min:").concat(minRequiredMatchingWords, ")"));
                }
                return isValidRecord;
            }
            FirstTimeRecognition_Vendor.validateVendorRecordForPostalAddress = validateVendorRecordForPostalAddress;
            // #endregion validation functions
            function SearchVendorNumber(companyCode, vendorNumber, vendorName, funcFillVendor, taxID) {
                var filter = "";
                if (taxID) {
                    filter = Sys.Helpers.LdapUtil.FilterEqual("VATNumber__", taxID).toString();
                }
                else if (vendorNumber) {
                    filter = Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber).toString();
                }
                else if (vendorName) {
                    filter = Sys.Helpers.LdapUtil.FilterEqual("Name__", vendorName).toString();
                }
                if (!Sys.Helpers.IsEmpty(companyCode)) {
                    filter = filter.AddCompanyCodeFilter(companyCode);
                }
                var dbresult = null;
                var queryCallback = function (records, error) {
                    if (error) {
                        Log.Error(error);
                    }
                    else if (records && records.length > 0) {
                        dbresult = records[0];
                    }
                };
                Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, Lib.AP.GetExtendedVendorAttributes(), queryCallback, null, 1);
                if (!dbresult) {
                    // Discard pre-filled results
                    return false;
                }
                if (taxID) {
                    Log.Info("Vendor '".concat(dbresult.Name__, "' found from TaxID='").concat(taxID, "'"));
                }
                else {
                    traceDebug("FirstTimeReco vendor number '".concat(vendorNumber, "' already defined"));
                }
                funcFillVendor(dbresult);
                // Keep pre-filled results
                return true;
            }
            FirstTimeRecognition_Vendor.SearchVendorNumber = SearchVendorNumber;
            /**
             * @callback fillVendorCallback
             * @memberof Lib.P2P.FirstTimeRecognition_Vendor
             * @param {ESKMap<string>} result the vendor record values resulting from a GenericAPI call
             * @param {string} [lookupValue] the lookup value that permits to retrieve the vendor
             * @param {string} [desc] the desc of the method that permits to retrieve the vendor
             */
            /**
             * @callback highlightVendorCallback
             * @memberof Lib.P2P.FirstTimeRecognition_Vendor
             * @param {Lib.P2P.FirstTimeRecognition_Vendor.MatchingInfo} matchingInfo the matching info
             * @param {string} [lookupValue] the lookup value that permits to retrieve the vendor
             * @param {string} [desc] the desc of the method that permits to retrieve the vendor
             */
            /**
             * @callback searchFunctionCallback
             * @memberof Lib.P2P.FirstTimeRecognition_Vendor
             * @param {string} companyCode company code to search the vendor for
             * @param {string} vendorNumber current vendor number if any
             * @param {string} vendorName current vandor name if any
             * @param {Lib.P2P.FirstTimeRecognition_Vendor.fillVendorCallback} funcFillVendor function use to fill the form with the retrieved vendor information
             * @param {string} taxID current TaxID if any
             */
            /**
             * start the research of the vendor based on document information
             * @memberof Lib.P2P.FirstTimeRecognition_Vendor
             * @param {string|string[]} availableCultures culture otr list of cultures available for the current document
             * @param {string} companyCode company code to search the vendor for
             * @param {string} vendorNumber current vendor number if any
             * @param {string} vendorName current vandor name if any
             * @param {Lib.P2P.FirstTimeRecognition_Vendor.fillVendorCallback} funcFillVendor function use to fill the form with the retrieved vendor information
             * @param {Lib.P2P.FirstTimeRecognition_Vendor.highlightVendorCallback} funcHighlightVendor function use to highlight information on the document
             * @param {Lib.P2P.FirstTimeRecognition_Vendor.searchFunctionCallback} searchFunction function to use when the vendor has been already found by teaching or autolearning
             * @param {string} taxID current TaxID if any
             * @param {string} filterToAdd use this param to add a filter to the queries. Can be used to ignore some result, in quote in PR used to ignore Empl as Vendor
             */
            function Recognize(availableCultures, companyCode, vendorNumber, vendorName, funcFillVendor, funcHighlightVendor, searchFunction, invoiceDocument, taxID, filterToAdd) {
                var checkIBANAgainstVendor = function () {
                    // feed IBAN's lookupResults to warn for wrong IBAN
                    var lookupResult = Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSIBAN(companyCode, invoiceDocument, filterToAdd);
                    if (lookupResult) {
                        var desc = "by IBAN";
                        if (lookupResult.dbresult) {
                            // check if it match the current vendor
                            var ibanVendorNumber = lookupResult.dbresult.Number__;
                            var area = Lib.P2P.FirstTimeRecognition_Vendor.GetBestMatchedArea(lookupResult.areas);
                            lookupResults[desc] = area;
                            if (ibanVendorNumber === vendorNumber && area) {
                                return;
                            }
                        }
                        else if (lookupResult.areas && lookupResult.areas.length > 0 && !lookupResults[desc]) {
                            lookupResults[desc] = lookupResult.areas[0];
                        }
                    }
                };
                var found = false;
                Init();
                FirstTimeRecognition_Vendor.cultureManager = new CultureManager();
                FirstTimeRecognition_Vendor.cultureManager.SetAvailableCultures(availableCultures);
                if (typeof availableCultures === "string") {
                    availableCultures = [availableCultures];
                }
                // Vendor already defined by teaching / Learning
                if (searchFunction && (taxID || vendorNumber || vendorName)) {
                    if (options.searchIBAN) {
                        checkIBANAgainstVendor();
                    }
                    searchFunction(companyCode, vendorNumber, vendorName, funcFillVendor, taxID);
                    if (taxID) {
                        var objMatchingTInfo = {
                            zone: Data.GetArea("ExtractedVendorTaxID__"),
                            columns: ["VATumber__", "Number__", "Name__"]
                        };
                        funcHighlightVendor(objMatchingTInfo);
                    }
                    return true;
                }
                // Recognition by VAT (each available culture), then phone fax (each available culture), then address bloc (each available culture)
                var arrayMatchFunctions = [];
                if (options.searchIBAN) {
                    arrayMatchFunctions.push({ "func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSIBAN, "desc": "by IBAN", "cultureIndependant": true });
                }
                if (options.searchVAT) {
                    arrayMatchFunctions.push({ "func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSVAT, "desc": "by VAT" });
                }
                if (options.searchPhoneOrFax) {
                    arrayMatchFunctions.push({ "func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPhoneOrFax, "desc": "by Phone number or fax" });
                }
                if (options.searchAddress) {
                    arrayMatchFunctions.push({ "func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPostal, "desc": "by address bloc" });
                }
                var customArrayMatchFunctions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.FTRVendor.GetVendorFTRMethods", arrayMatchFunctions, FirstTimeRecognition_Vendor.cultureManager) || arrayMatchFunctions;
                var RunMatchFunction = function (testFunc, culture) {
                    var desc = testFunc.desc;
                    var lookupResult = testFunc.func(companyCode, invoiceDocument, filterToAdd);
                    if (lookupResult) {
                        if (lookupResult.dbresult) {
                            var area = Lib.P2P.FirstTimeRecognition_Vendor.GetBestMatchedArea(lookupResult.areas);
                            var lookupValue = null;
                            if (area) {
                                lookupResults[desc] = area;
                                lookupValue = area.value;
                                funcHighlightVendor(area);
                            }
                            funcFillVendor(lookupResult.dbresult, lookupValue, desc);
                            if (culture) {
                                Log.Info("Found vendor number: '".concat(lookupResult.dbresult.Number__, "' ").concat(desc, " with culture:'").concat(culture, "'"));
                            }
                            else {
                                Log.Info("Found vendor number: '".concat(lookupResult.dbresult.Number__, "' ").concat(desc));
                            }
                            return true;
                        }
                        else if (lookupResult.areas && lookupResult.areas.length > 0 && !lookupResults[desc]) {
                            lookupResults[desc] = lookupResult.areas[0];
                        }
                    }
                    return false;
                };
                for (var testFuncIdx = 0; testFuncIdx < customArrayMatchFunctions.length && !found; testFuncIdx++) {
                    var testFunc = customArrayMatchFunctions[testFuncIdx];
                    if (testFunc.cultureIndependant) {
                        found = RunMatchFunction(testFunc);
                    }
                    else {
                        for (var cultureIdx = 0; cultureIdx < availableCultures.length; cultureIdx++) {
                            FirstTimeRecognition_Vendor.cultureManager.SetCurrentDocumentCulture(availableCultures[cultureIdx]);
                            found = RunMatchFunction(testFunc, availableCultures[cultureIdx]);
                            if (found) {
                                break;
                            }
                        }
                    }
                }
                if (!found) {
                    Log.Warn("No vendor found.");
                }
                return found;
            }
            FirstTimeRecognition_Vendor.Recognize = Recognize;
        })(FirstTimeRecognition_Vendor = P2P.FirstTimeRecognition_Vendor || (P2P.FirstTimeRecognition_Vendor = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
