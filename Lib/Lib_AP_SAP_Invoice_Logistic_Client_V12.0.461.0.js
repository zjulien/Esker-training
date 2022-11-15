/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Invoice_Logistic_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Lib_AP_SAP_Invoice_Client_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-this-alias */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Invoice;
            (function (Invoice) {
                var Logistic;
                (function (Logistic) {
                    // class
                    var SAPCheckInput = /** @class */ (function () {
                        function SAPCheckInput(params, item, quantity) {
                            var headerData = params.Bapi.EXPORTS.HEADERDATA;
                            /* BUKRS */ this.CompanyCode = headerData.COMP_CODE;
                            /* WAERS */ this.CurrencyKey = headerData.CURRENCY;
                            // S:Debit - H:Credit
                            /* SHKZG */ this.DebitCreditIndicator = Sys.Helpers.String.SAP.Trim(headerData.INVOICE_IND).length > 0 ? "S" : "H";
                            /* REMNG */ this.InvoicedQuantity = item.Iv_Qty;
                            /* WEPOS */ this.IsGoodReceipt = item.Gr_Ind;
                            /* NETWR */ this.NetValue = item.refNetValue;
                            this.NoQuantity = !!(item.Item_Cat === "9" || item.Item_Cat === "1");
                            /* BSMNG */ this.OrderedQuantity = item.Quantity;
                            /* MENGE */ this.Quantity = this.NoQuantity ? item.Quantity : quantity;
                            /* RETPO */ this.ReturnsItem = item.Ret_Item;
                            /* TBTKZ */ this.SubsequentDebitCredit = !!params.Subsequent_Doc;
                            /* XEKBZ */ this.UpdateDeliveryCosts = this.SubsequentDebitCredit;
                        }
                        return SAPCheckInput;
                    }());
                    var SAPQuantityCheckInput = /** @class */ (function (_super) {
                        __extends(SAPQuantityCheckInput, _super);
                        function SAPQuantityCheckInput(params, item, quantity) {
                            var _this = _super.call(this, params, item, quantity) || this;
                            /* WEMNG */ _this.DeliveredQuantity = item.Deliv_Qty;
                            /* LFBNR */ _this.DocumentNumber = item.Ref_Doc;
                            /* WEBRE */ _this.GRVerification = item.Gr_Basediv;
                            // B:BAPI Invoice
                            /* IVTYP */ _this.OriginOfVerification = "B";
                            _this.TranslationDate = params.Bapi.EXPORTS.HEADERDATA.PSTNG_DATE;
                            return _this;
                        }
                        return SAPQuantityCheckInput;
                    }(SAPCheckInput));
                    var SAPAmountCheckInput = /** @class */ (function (_super) {
                        __extends(SAPAmountCheckInput, _super);
                        function SAPAmountCheckInput(params, item, quantity, amount, entrySheetValue) {
                            var _this = _super.call(this, params, item, quantity) || this;
                            /* WEUNB */ _this.Amount = amount;
                            // Denominator for conv. of order price unit into order unit
                            /* WWERT */ _this.ConversionDenominator = item.Conv_Den1;
                            // Numerator for conversion of order price unit into order unit
                            /* XBPRM */ _this.ConversionNumerator = item.Conv_Num1;
                            /* PSTYP */ _this.GRNonValuated = item.Gr_Non_Val;
                            /* SCHPR */ _this.AcceptedNetValue = item.Item_Cat === "9" ? entrySheetValue : 0.0;
                            /* BPUMN */ _this.InvoicedAmount = item.refInvoicedAmount;
                            /* REFWR */ _this.IsEstimatedPrice = item.Est_Price;
                            /* BPUMZ */ _this.ItemCategory = item.Item_Cat;
                            // Not used here
                            /* WRBTR */ _this.NewInputValues = false;
                            // Quantity in purchase order price unit
                            /* BPMNG */ _this.QuantityInPOUnit = _this.Quantity * _this.ConversionNumerator / _this.ConversionDenominator;
                            /* WENWR */ _this.TranslationDate = params.Bapi.EXPORTS.HEADERDATA.PSTNG_DATE;
                            return _this;
                        }
                        return SAPAmountCheckInput;
                    }(SAPCheckInput));
                    var SAPCreditorCheckInput = /** @class */ (function () {
                        function SAPCreditorCheckInput(item, poNumber, vendor) {
                            /* XWARE */ this.IsGoodsInvoice = true;
                            // Planned delivery costs indicator (Incoming Invoice, Header Data)
                            /* XBNK */ this.IsPlannedDeliveryCosts = false;
                            /* XEKBE */ this.CheckItemsPosition = true;
                            // Type of delivery cost selection (Incoming Invoice, Header Data)
                            /* BNKSEL */ this.DeliveryCostSelectionType = "";
                            /* EBELN */ this.PONumber = poNumber;
                            // Different invoicing party (Purchasing Document Header)
                            /* ELIFRE */ this.PODocHeaderInvoicingParty = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.Diff_Inv);
                            /* ELIFNR */ this.Vendor = item.Vendor;
                            // Different invoicing party (Incoming Invoice, Header Data)
                            /* RLIFNR */ this.InvoiceHeaderInvoicingParty = vendor;
                            // Number of the selection vendor (Incoming Invoice, Header Data)
                            /* RSELIF */ this.InvoiceHeaderVendor = "";
                            /* XLIFNR */ this.CheckVendor = true;
                            /* XLIFRE */ this.CheckInvoicingParty = true;
                        }
                        return SAPCreditorCheckInput;
                    }());
                    var MessageSetting = /** @class */ (function () {
                        function MessageSetting(item) {
                            /* MSGTS */ this.ActiveType = item.MSGTS;
                            /* MSGTB */ this.ActiveTypeForBI = item.MSGTB;
                            /* ARBGB */ this.ApplicationArea = Sys.Helpers.String.SAP.Trim(item.ARBGB);
                            /* MSGNR */ this.Number = item.MSGNR;
                            /* UNAME */ this.UserName = Sys.Helpers.String.SAP.Trim(item.UNAME);
                        }
                        return MessageSetting;
                    }());
                    var CustomizedMessage = /** @class */ (function () {
                        function CustomizedMessage(id, nb, type, language, param1, param2, param3, param4, textFormat) {
                            this.Retrieved = false;
                            this.ApplicationArea = id ? id : "";
                            this.Language = language ? language : "";
                            this.Number = nb ? nb : "";
                            this.Param1 = param1 ? param1 : "";
                            this.Param2 = param2 ? param2 : "";
                            this.Param3 = param3 ? param3 : "";
                            this.Param4 = param4 ? param4 : "";
                            this.Text = "";
                            this.TextFormat = textFormat ? textFormat : "ASC";
                            this.TextLong = "";
                            this.Type = type ? type : "W";
                        }
                        return CustomizedMessage;
                    }());
                    var ToleranceSettings = /** @class */ (function () {
                        function ToleranceSettings(item) {
                            this.Active = true;
                            /* BUKRS */ this.CompanyCode = item.BUKRS;
                            /* WAERS */ this.CurrencyKey = item.WAERS;
                            /* XP2JA */ this.CheckPercentLimitHigh = Sys.Helpers.String.SAP.Trim(item.XP2JA).length > 0;
                            /* XP1JA */ this.CheckPercentLimitLow = Sys.Helpers.String.SAP.Trim(item.XP1JA).length > 0;
                            /* XW2JA */ this.CheckValueLimitHigh = Sys.Helpers.String.SAP.Trim(item.XW2JA).length > 0;
                            /* XW1JA */ this.CheckValueLimitLow = Sys.Helpers.String.SAP.Trim(item.XW1JA).length > 0;
                            /* XP2NE */ this.NotCheckPercentLimitHigh = Sys.Helpers.String.SAP.Trim(item.XP2NE).length > 0;
                            /* XP1NE */ this.NotCheckPercentLimitLow = Sys.Helpers.String.SAP.Trim(item.XP1NE).length > 0;
                            /* XW2NE */ this.NotCheckValueLimitHigh = Sys.Helpers.String.SAP.Trim(item.XW2NE).length > 0;
                            /* XW1NE */ this.NotCheckValueLimitLow = Sys.Helpers.String.SAP.Trim(item.XW1NE).length > 0;
                            if (item.PROZ2.indexOf("*") >= 0) {
                                /* PROZ2 */ this.PercentHigh = 10;
                            }
                            else {
                                /* PROZ2 */ this.PercentHigh = parseFloat(item.PROZ2);
                            }
                            if (item.PROZ1.indexOf("*") >= 0) {
                                /* PROZ1 */ this.PercentLow = 10;
                            }
                            else {
                                /* PROZ1 */ this.PercentLow = parseFloat(item.PROZ1);
                            }
                            /* WERT2 */ this.ValueHigh = parseFloat(item.WERT2);
                            /* WERT1 */ this.ValueLow = parseFloat(item.WERT1);
                            /* TOLSL */ this.ToleranceKey = item.TOLSL;
                            if (this.ToleranceKey === "LD") {
                                // Timeout limit order -> no percentage limit
                                this.CheckPercentLimitLow = false;
                                this.CheckPercentLimitHigh = false;
                            }
                            else if (this.ToleranceKey === "BR" || this.ToleranceKey === "BW") {
                                // Order price -> no limit on the amount
                                this.CheckValueLimitLow = false;
                                this.CheckValueLimitHigh = false;
                            }
                            else if (this.ToleranceKey === "BD") {
                                // Small differences -> only absoluze ceiling
                                this.CheckValueLimitLow = false;
                                this.CheckPercentLimitLow = false;
                                this.CheckPercentLimitHigh = false;
                            }
                        }
                        return ToleranceSettings;
                    }());
                    var LogisticVerification = /** @class */ (function () {
                        function LogisticVerification() {
                            this.CustomizedMessages = [];
                            this.MessagesSettings = {};
                            this.TolerancesSettings = {};
                            this.POHistory = {};
                        }
                        LogisticVerification.prototype.ResetCustomizedMessages = function () {
                            this.CustomizedMessages = [];
                        };
                        /**
                         * Retrieve message settings from SAP using table T100C. Message will be added to MessageSettings list
                         * @param {function} callback
                         * @param {string} userName user from which the message settings should be retrieve
                         */
                        LogisticVerification.prototype.RetrieveSAPMessageSettings = function (callback, userName) {
                            var that = this;
                            var userNameUpperized = userName ? userName.toUpperCase() : "";
                            that.MessagesSettings[userNameUpperized] = [];
                            var filter = "UNAME = '" + userNameUpperized + "' OR UNAME = ''";
                            function readSAPTableCallback(result) {
                                if (result) {
                                    for (var i = 0; i < result.length; i++) {
                                        var settings = new MessageSetting(result[i]);
                                        that.MessagesSettings[userNameUpperized].push(settings);
                                    }
                                }
                                callback();
                            }
                            Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "T100C", "ARBGB|MSGNR|UNAME|MSGTS|MSGTB", filter, 0, 0, false, { useCache: true });
                        };
                        /**
                         * Return the list of message type store as settings for user in SAP for a specific message. (use cache)
                         * @param {function} callback
                         * @param {string} id the Application area of the message to retrieve
                         * @param {string} number the number of the message in the application area
                         * @param {string} userName user from which the settings should be retrieve
                         * @returns {Array(string)}
                         */
                        LogisticVerification.prototype.GetSAPMessageSettings = function (callback, id, nb, userName) {
                            var userNameUpperized = userName ? userName.toUpperCase() : "";
                            var that = this;
                            function getUserMessageType(messagesSettings, userFilter) {
                                for (var j = 0; j < messagesSettings[userNameUpperized].length; j++) {
                                    var settings = messagesSettings[userNameUpperized][j];
                                    if (settings.ApplicationArea === id.toUpperCase() && settings.Number === nb && settings.UserName === userFilter) {
                                        return {
                                            UserName: settings.UserName,
                                            Type: settings.ActiveType,
                                            MessageTypeForBI: settings.ActiveTypeForBI
                                        };
                                    }
                                }
                                return null;
                            }
                            function retrievesapMessageSettingsCallback() {
                                /**
                                 *First search specific user message settings then if not found search for empty users
                                */
                                var messageType = getUserMessageType(that.MessagesSettings, userNameUpperized);
                                if (!messageType) {
                                    messageType = getUserMessageType(that.MessagesSettings, "");
                                }
                                callback(messageType);
                            }
                            if (!this.MessagesSettings[userNameUpperized]) {
                                this.RetrieveSAPMessageSettings(retrievesapMessageSettingsCallback, userNameUpperized);
                            }
                            else {
                                retrievesapMessageSettingsCallback();
                            }
                        };
                        /**
                         * Get a customized message using the specified BAPI
                         * @param {function} callback
                         * @param {string} id the Application area of the message to retrieve
                         * @param {string} number the number of the message in the application area
                         * @param {string} type the type to set on the message by default
                         * @param {string} language the language the message should be translate to
                         * @param {string} param1 first specific parameter for message formatting
                         * @param {string} param2 second specific parameter for message formatting
                         * @param {string} param3 third specific parameter for message formatting
                         * @param {string} param4 fourth specific parameter for message formatting
                         * @param {string} textFormat format to applier to text (default is "ASC")
                         * @returns {CustomizedMessage|null}
                         */
                        LogisticVerification.prototype.GetCustomizedMessage = function (callback, message, textFormat) {
                            function getDetailCallback(jsonResult) {
                                if (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) {
                                    var retrievedMessage = new CustomizedMessage(message.ApplicationArea, message.Number, message.Type, message.Language, message.Param1, message.Param2, message.Param3, message.Param4, textFormat);
                                    var textLong = "";
                                    for (var i = 0; i < jsonResult.TABLES.TEXT.length; i++) {
                                        textLong += jsonResult.TABLES.TEXT[i].LINE + "\n";
                                    }
                                    retrievedMessage.Text = jsonResult.IMPORTS.MESSAGE;
                                    retrievedMessage.TextLong = textLong;
                                    retrievedMessage.Retrieved = true;
                                    callback(retrievedMessage);
                                }
                                else {
                                    Sys.Helpers.SAP.SetLastError("GetCustomizedMessage failed: " + jsonResult.ERRORS[0].err);
                                    callback(null);
                                }
                            }
                            var bapiParams = {
                                EXPORTS: {
                                    ID: message.ApplicationArea,
                                    NUMBER: message.Number,
                                    LANGUAGE: message.Language,
                                    TEXTFORMAT: textFormat ? textFormat : "ASC",
                                    LINKPATTERN: "",
                                    MESSAGE_V1: message.Param1,
                                    MESSAGE_V2: message.Param2,
                                    MESSAGE_V3: message.Param3,
                                    MESSAGE_V4: message.Param4
                                },
                                USECACHE: true
                            };
                            Lib.AP.SAP.SAPCallBapi(getDetailCallback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_MESSAGE_GETDETAIL", bapiParams);
                        };
                        /**
                        * Add a customized message using the specified BAPI
                        * @param {function} callback
                        * @param {object} params the parameters for SAP dialogs
                        * @param {string} id the Application area of the message to retrieve
                        * @param {string} number the number of the message in the application area
                        * @param {string} defaultType the type to set on the message if not retrieved from customized settings
                        * @param {string} language the language the message should be translate to
                        * @param {string} param1 first specific parameter for message formatting
                        * @param {string} param2 second specific parameter for message formatting
                        * @param {string} param3 third specific parameter for message formatting
                        * @param {string} param4 fourth specific parameter for message formatting
                        * @returns {boolean} indicator if a message has been added to CustomizedMessages list or not
                        */
                        LogisticVerification.prototype.RetrieveCustomizedMessageFromSAP = function (callback, customizedMessage) {
                            var that = this;
                            var retrievedMessage = null;
                            function sapMessageSettingsCallback(messageType) {
                                if (messageType && messageType.Type) {
                                    // Current user specified, should have only one settings
                                    retrievedMessage.Type = messageType.Type;
                                }
                                else {
                                    retrievedMessage.Type = customizedMessage.Type;
                                }
                                if (retrievedMessage.Text.length > 0 && retrievedMessage.Type !== "-") {
                                    callback(retrievedMessage);
                                }
                                else {
                                    callback(null);
                                }
                            }
                            function userNameCallback(userName) {
                                that.GetSAPMessageSettings(sapMessageSettingsCallback, retrievedMessage.ApplicationArea, retrievedMessage.Number, userName);
                            }
                            function customizedMessageCallback(message) {
                                if (message) {
                                    retrievedMessage = message;
                                    if (Lib.AP.SAP.UsesWebServices()) {
                                        var sapUser = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSUser");
                                        userNameCallback(Sys.Helpers.Globals.User.erpUser || sapUser);
                                    }
                                    else {
                                        Sys.Helpers.SAP.GetSAPUserName(userNameCallback, Variable.GetValueAsString("SAPConfiguration"));
                                    }
                                }
                                else {
                                    callback(null);
                                }
                            }
                            if (!customizedMessage.Retrieved) {
                                this.GetCustomizedMessage(customizedMessageCallback, customizedMessage, "ASC");
                            }
                            else {
                                callback(customizedMessage);
                            }
                        };
                        LogisticVerification.prototype.AddCustomizedMessage = function (id, nb, defaultType, language, param1, param2, param3, param4) {
                            this.CustomizedMessages.push(new CustomizedMessage(id, nb, defaultType, language, param1, param2, param3, param4));
                        };
                        /**
                        * Get the message number for quantity above depending on the context
                        * @param {string} the tolerance key in case of 0 delivered
                        * @param {boolean} isGR
                        * @param {boolean} returnItems
                        * @param {boolean} verifyGR
                        * @returns {string} message number
                        */
                        LogisticVerification.prototype.GetMessageForQuantityTooHigh = function (toleranceKey, isGR, returnItems, verifyGR) {
                            var msgnr;
                            if (isGR) {
                                if (toleranceKey === "DW") {
                                    // Quantity delivered is zero
                                    msgnr = "088";
                                }
                                else if (returnItems) {
                                    // Credit memo qty greater than returned qty
                                    msgnr = verifyGR ? "503" : "477";
                                }
                                else {
                                    // Quantity invoiced greater than goods receipt quantity
                                    msgnr = verifyGR ? "504" : "081";
                                }
                            }
                            else if (returnItems) {
                                // Credit memo qty greater than order qty (item without GR)
                                msgnr = "482";
                            }
                            else {
                                // Invoice quantity greater than PO quantity (item without GR)
                                msgnr = "087";
                            }
                            return msgnr;
                        };
                        /**
                        * Get the message number for quantity below depending on the context
                        * @param {boolean} isGR
                        * @param {boolean} returnItems
                        * @param {boolean} updateDeliveryCosts
                        * @returns {string} message number
                        */
                        LogisticVerification.prototype.GetMessageForQuantityTooLow = function (isGR, returnItems, updateDeliveryCosts) {
                            var msgnr;
                            if (updateDeliveryCosts) {
                                if (returnItems) {
                                    // Qty entered is greater than the open credit memo qty
                                    msgnr = "471";
                                }
                                else {
                                    // Quantity entered smaller than quantity still to be invoiced
                                    msgnr = "070";
                                }
                            }
                            else if (isGR) {
                                if (returnItems) {
                                    // Credit memo qty smaller than GR qty
                                    msgnr = "483";
                                }
                                else {
                                    // Quantity invoiced is smaller than GR quantity
                                    msgnr = "194";
                                }
                            }
                            else if (returnItems) {
                                // Credit memo qty smaller than PO qty (no GR)
                                msgnr = "484";
                            }
                            else {
                                // Quantity invoiced is smaller than order quantity (no GR)
                                msgnr = "195";
                            }
                            return msgnr;
                        };
                        /**
                        * retrieve the tolerance settings from SAP using table T169G and feed ToleranceSettings list
                        * @param {function} callback
                        * @param {string} companyCode
                        * @param {string} toleranceKey
                        * @returns {object} the retrieved tolerance settings object
                        */
                        LogisticVerification.prototype.RetrieveToleranceSettings = function (callback, companyCode, toleranceKey) {
                            var that = this;
                            var filter = "BUKRS = '" + companyCode + "' AND TOLSL = '" + toleranceKey + "'";
                            function readSAPTableCallback(result) {
                                var settings = null;
                                if (result && result.length > 0) {
                                    var message = void 0;
                                    if (result[0].PROZ1.indexOf("*") >= 0) {
                                        message = new CustomizedMessage();
                                        message.Retrieved = true;
                                        message.Text = Language.Translate("_Error reading table field {0}, please customize your tolerance limits. {1} limit will be used.", false, "T169G-PROZ1", "10%");
                                        that.CustomizedMessages.push(message);
                                    }
                                    if (result[0].PROZ2.indexOf("*") >= 0) {
                                        message = new CustomizedMessage();
                                        message.Retrieved = true;
                                        message.Text = Language.Translate("_Error reading table field {0}, please customize your tolerance limits. {1} limit will be used.", false, "T169G-PROZ2", "10%");
                                        that.CustomizedMessages.push(message);
                                    }
                                    settings = new ToleranceSettings(result[0]);
                                }
                                if (!settings) {
                                    settings = { "CompanyCode": companyCode, "ToleranceKey": toleranceKey, "Active": false };
                                }
                                if (!that.TolerancesSettings[companyCode]) {
                                    that.TolerancesSettings[companyCode] = [];
                                }
                                that.TolerancesSettings[companyCode][toleranceKey] = settings;
                                callback(settings);
                            }
                            Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "T169G", "BUKRS|TOLSL|WERT1|XW1JA|XW1NE|WERT2|XW2JA|XW2NE|PROZ1|XP1JA|XP1NE|PROZ2|XP2JA|XP2NE|WAERS", filter, 0, 0, false, { useCache: true });
                        };
                        /**
                        * Get the desired tolerance setting from TolerancesSettings list (request SAP if necessary)
                        * @param {function} callback
                        * @param {string} companyCode
                        * @param {string} toleranceKey
                        * @returns {object} tolerance settings object
                        */
                        LogisticVerification.prototype.GetToleranceSettings = function (callback, companyCode, toleranceKey) {
                            if (this.TolerancesSettings[companyCode] && this.TolerancesSettings[companyCode][toleranceKey]) {
                                callback(this.TolerancesSettings[companyCode][toleranceKey]);
                            }
                            else {
                                this.RetrieveToleranceSettings(callback, companyCode, toleranceKey);
                            }
                        };
                        /**
                        * check if tolerance check be performed considering SAP settings
                        * @param {object} settings
                        * @returns {boolean}
                        */
                        LogisticVerification.prototype.BypassToleranceCheck = function (settings) {
                            return !settings || !settings.Active || (settings.NotCheckValueLimitHigh && settings.NotCheckValueLimitLow && settings.NotCheckPercentLimitLow && settings.NotCheckPercentLimitHigh);
                        };
                        /**
                        * Convert value to foreign currency
                        * @param {function} callback
                        * @param {number} value the value to be checked
                        * @param {string} companyCode
                        * @param {string} currencyKey local currency
                        * @param {string} foreignCurrencyKey foreign currency
                        * @param {string} translationDate date of translation to retrieve the ratio between local and foreign
                        * @param {number} exchangeRate specific rate to apply on conversion
                        * @returns {number|null} return the value if no conversion required, the converted value if conversion succeed, null otherwise
                        */
                        LogisticVerification.prototype.ConvertToForeignCurrency = function (callback, value, companyCode, currencyKey, foreignCurrencyKey, translationDate, exchangeRate) {
                            var that = this;
                            function convertToForeignCurrencyCallBack(res) {
                                if (res) {
                                    callback(res.ForeignAmount);
                                }
                                else {
                                    var message = new CustomizedMessage();
                                    message.Retrieved = true;
                                    message.Text = Sys.Helpers.SAP.GetLastError();
                                    that.CustomizedMessages.push(message);
                                    callback(null);
                                }
                            }
                            function getCompanyCodeCurrencyCallBack(result) {
                                currencyKey = result;
                                if (currencyKey !== foreignCurrencyKey) {
                                    Lib.AP.SAP.ConvertToForeignCurrencyClient(convertToForeignCurrencyCallBack, value, currencyKey, foreignCurrencyKey, translationDate, exchangeRate, "M", true);
                                }
                                else {
                                    callback(value);
                                }
                            }
                            if (currencyKey === "") {
                                var sapQueryOptions = null;
                                if (Sys.ScriptInfo.IsClient() && Lib.AP.SAP.UsesWebServices()) {
                                    sapQueryOptions = { handler: Lib.AP.SAP.SAPQuery };
                                }
                                Sys.Helpers.SAP.GetCompanyCodeCurrency(getCompanyCodeCurrencyCallBack, Variable.GetValueAsString("SAPConfiguration"), companyCode, sapQueryOptions);
                            }
                            else {
                                getCompanyCodeCurrencyCallBack(currencyKey);
                            }
                        };
                        /**
                        * returns true if the absolute difference between values is lower or equal to amount limit
                        */
                        LogisticVerification.prototype.ToleranceCheckAmount = function (value, comparisonValue, amountLimit) {
                            var diff = Math.abs(value - comparisonValue);
                            if (diff > amountLimit) {
                                return false;
                            }
                            return true;
                        };
                        /**
                        * returns true if the percentage relation of values is lower or equal to percent limit
                        */
                        LogisticVerification.prototype.ToleranceCheckPercent = function (value, comparisonValue, percentLimit) {
                            if (comparisonValue !== 0) {
                                var percent = value * 100 / comparisonValue;
                                if (percent > 100) {
                                    percent -= 100;
                                }
                                else {
                                    percent = 100 - percent;
                                }
                                if (percent > 999999999999999) {
                                    percent = 999999999999999;
                                }
                                if (percent > percentLimit) {
                                    return false;
                                }
                            }
                            else if (value !== 0) {
                                return false;
                            }
                            return true;
                        };
                        /**
                        * Check if the value is valid according to tolerance settings from SAP
                        * @param {function} callback
                        * @param {number} value the value to be checked
                        * @param {number} comparisonValue the value to compare from
                        * @param {string} companyCode
                        * @param {string} toleranceKey
                        * @param {boolean} bConversion indicate if the value should be converted from foreign information
                        * @param {string} currencyKey local currency
                        * @param {string} foreignCurrencyKey foreign currency
                        * @param {string} translationDate date of translation to retrieve the ratio between local and foreign
                        * @param {number} exchangeRate specific rate to apply on conversion
                        * @returns {ToleranceCheckResult} { "Amount": value, // Amount in document currency
                        *						"Percent":0, // Percentage tolerance limit
                        *						"returnType": ""; // return "" if okay, "A" if amount check fails, "P" if percent check fails
                        *						"ReturnCode": 0, // return 0 if check is ok, 1 if below the limit, 2 if above the limit
                        *						"ReturnCode": 0,
                        *						"HasError": false }
                        */
                        LogisticVerification.prototype.ToleranceCheck = function (callback, value, comparisonValue, companyCode, toleranceKey, bConversion, currencyKey, foreignCurrencyKey, translationDate, exchangeRate) {
                            var that = this;
                            // formatted result
                            var result = {
                                Amount: value,
                                Percent: 0,
                                ReturnType: "",
                                ReturnCode: 0,
                                HasError: false
                            };
                            var T169G = null;
                            function checkTolerance(amountLimit) {
                                var isHigher = comparisonValue >= 0 ? value > comparisonValue : value < comparisonValue;
                                var mode = isHigher ? "High" : "Low";
                                var bCheckAmount = T169G["CheckValueLimit" + mode];
                                var bCheckPercent = T169G["CheckPercentLimit" + mode];
                                var percentLimit = T169G["Percent" + mode];
                                if (bCheckAmount && !that.ToleranceCheckAmount(value, comparisonValue, amountLimit)) {
                                    result.Amount = amountLimit;
                                    result.ReturnType = "A";
                                    result.ReturnCode = isHigher ? 2 : 1;
                                }
                                if (bCheckPercent && result.ReturnCode === 0 && !that.ToleranceCheckPercent(value, comparisonValue, percentLimit)) {
                                    result.ReturnType = "P";
                                    result.ReturnCode = isHigher ? 2 : 1;
                                    result.Percent = percentLimit;
                                }
                                callback(result);
                            }
                            function convertToForeignCurrencyCallback(amountLimit) {
                                if (!amountLimit) {
                                    result.HasError = true;
                                    callback(result);
                                }
                                else {
                                    checkTolerance(amountLimit);
                                }
                            }
                            function getToleranceSettingsCallback(settings) {
                                T169G = settings;
                                if (!that.BypassToleranceCheck(T169G)) {
                                    var isHigher = comparisonValue >= 0 ? value > comparisonValue : value < comparisonValue;
                                    var mode = isHigher ? "High" : "Low";
                                    var bCheckAmount = T169G["CheckValueLimit" + mode];
                                    var amountLimit = T169G["Value" + mode];
                                    if (bCheckAmount && bConversion && foreignCurrencyKey) {
                                        that.ConvertToForeignCurrency(convertToForeignCurrencyCallback, amountLimit, companyCode, currencyKey, foreignCurrencyKey, translationDate, exchangeRate);
                                    }
                                    else {
                                        checkTolerance(amountLimit);
                                    }
                                }
                                else {
                                    callback(result);
                                }
                            }
                            // tolerance check logic:
                            this.GetToleranceSettings(getToleranceSettingsCallback, companyCode, toleranceKey);
                        };
                        /**
                        * returns true if the input refers to a Debit
                        */
                        LogisticVerification.prototype.IsDebit = function (input) {
                            if (!input.ReturnsItem || input.UpdateDeliveryCosts) {
                                return input.DebitCreditIndicator === "S";
                            }
                            return input.DebitCreditIndicator === "H";
                        };
                        /**
                        * return true if value is below 9999999999.999
                        * else return false and add an 547 error message to CustomizedMessages list.
                        */
                        LogisticVerification.prototype.CheckMaximumValue = function (value, language, id) {
                            if (value > 9999999999.999) {
                                // Internal error: in function module MRM_QUANTITY_CHECK
                                this.AddCustomizedMessage("M8", "547", "E", language, id, "", "", "");
                                return false;
                            }
                            return true;
                        };
                        /**
                        * call ToleranceCheck if required and add messages to CustomizedMessages list according to results.
                        */
                        LogisticVerification.prototype.QuantityCheckTolerance = function (callback, language, input, quantity) {
                            var that = this;
                            var price = input.NetValue / input.OrderedQuantity;
                            var currentValue = price * quantity;
                            var comparisonValue = input.DeliveredQuantity ? price * input.DeliveredQuantity : 0;
                            var toleranceKey = input.DeliveredQuantity === 0 ? "DW" : "DQ";
                            function toleranceCheckCallback(result) {
                                if (!result.HasError) {
                                    var msgnr = "";
                                    if (result.ReturnCode === 1) {
                                        // below
                                        msgnr = that.GetMessageForQuantityTooLow(input.IsGoodReceipt, input.ReturnsItem, input.UpdateDeliveryCosts);
                                    }
                                    else if (result.ReturnCode === 2 && quantity > input.DeliveredQuantity) {
                                        // above
                                        msgnr = that.GetMessageForQuantityTooHigh(toleranceKey, input.IsGoodReceipt, input.ReturnsItem, input.GRVerification);
                                    }
                                    if (msgnr.length > 0) {
                                        that.AddCustomizedMessage("M8", msgnr, "W", language, "", "", "", "");
                                    }
                                }
                                callback();
                            }
                            var checkCurrentValueTolerance = this.CheckMaximumValue(currentValue, language, "Quantity_Check");
                            var checkComparisonValueTolerance = this.CheckMaximumValue(comparisonValue, language, "Quantity_Check");
                            if (checkCurrentValueTolerance && checkComparisonValueTolerance) {
                                this.ToleranceCheck(toleranceCheckCallback, currentValue, comparisonValue, input.CompanyCode, toleranceKey, false, "", input.CurrencyKey, input.TranslationDate, 0);
                            }
                            else {
                                callback();
                            }
                        };
                        /**
                        * check the quantity in case of Debit
                        */
                        LogisticVerification.prototype.QuantityCheckDebit = function (callback, language, input) {
                            var quantity = input.Quantity + input.InvoicedQuantity;
                            if (this.CheckMaximumValue(quantity, language, "Quantity_Check")) {
                                if (input.SubsequentDebitCredit) {
                                    if (input.Quantity > input.InvoicedQuantity && input.OriginOfVerification !== "5") {
                                        // 472: Qty entered greater than qty that could be credited
                                        // 074: Quantity entered larger than quantity to be debited
                                        this.AddCustomizedMessage("M8", input.ReturnsItem ? "472" : "074", "E", language, "", "", "", "");
                                    }
                                }
                                else {
                                    if (input.GRVerification && quantity > input.DeliveredQuantity) {
                                        this.AddCustomizedMessage("M8", "504", "-", language, "", "", "", "");
                                        // Quantity invoiced greater than goods receipt quantity
                                        // stop if message is considered as error
                                        /*
                                        callback();
                                        return;
                                        */
                                    }
                                    this.QuantityCheckTolerance(callback, language, input, quantity);
                                    return;
                                }
                            }
                            callback();
                        };
                        /**
                        * check the quantity in case of Credit
                        */
                        LogisticVerification.prototype.QuantityCheckCredit = function (callback, language, input) {
                            if (input.Quantity > input.InvoicedQuantity && (!input.SubsequentDebitCredit || input.OriginOfVerification !== "5")) {
                                if (input.ReturnsItem) {
                                    // Reverse qty greater than qty credited so far
                                    this.AddCustomizedMessage("M8", "476", "E", language, "", "", "", "");
                                }
                                else {
                                    // Reversal quantity greater than quantity invoiced to date
                                    this.AddCustomizedMessage("M8", "080", "E", language, "", "", "", "");
                                }
                            }
                            callback();
                        };
                        /**
                        * Check if quantities is valid according to settings from SAP
                        * @param {function} callback
                        * @param {string} language to use for messages
                        * @param {SAPQuantityCheckInput} input params for to run the check on
                        */
                        LogisticVerification.prototype.QuantityCheck = function (callback, language, input) {
                            if (!input.NoQuantity) {
                                if (!input.IsGoodReceipt) {
                                    // if not GR: GR quantity of delivered GR equal to quantity
                                    input.DeliveredQuantity = input.OrderedQuantity;
                                }
                                if (input.GRVerification && input.DocumentNumber.length === 0) {
                                    // GR-based invoice verification: No goods receipt exists - You cannot enter the invoice
                                    this.AddCustomizedMessage("M8", "312", "E", language, "", "", "", "");
                                }
                                else if (this.IsDebit(input)) {
                                    this.QuantityCheckDebit(callback, language, input);
                                    return;
                                }
                                else {
                                    this.QuantityCheckCredit(callback, language, input);
                                    return;
                                }
                            }
                            callback();
                        };
                        /**
                        * check entries on Purchase Order History Categories (Table T163B)
                        * @param (function) callback
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        * @returns {boolean} false if we should stop checking value
                        */
                        LogisticVerification.prototype.AmountCheckPOHistory = function (callback, language, input) {
                            var that = this;
                            /** @this queryCallback */
                            function queryCallback() {
                                if (!this.GetQueryError()) {
                                    var queryValue = this.GetQueryValue();
                                    if (queryValue.Records && queryValue.Records.length > 0) {
                                        that.POHistory.Category = queryValue.GetQueryValue("BEWTP", 0);
                                        that.POHistory.SubsequentDebitCredit = queryValue.GetQueryValue("TBTKZ", 0).length > 0;
                                        that.POHistory.CheckPrice = queryValue.GetQueryValue("PRSPR", 0).length > 0;
                                        callback(that.POHistory.CheckPrice);
                                        return;
                                    }
                                }
                                that.AddCustomizedMessage("M8", "071", "E", language, "X", "", "", "");
                                callback(false);
                            }
                            if (!input.UpdateDeliveryCosts && input.SubsequentDebitCredit && !this.POHistory.SubsequentDebitCredit) {
                                // Reading Purchase Order History Categories (Table T163B) : Category 'X' stands for 'Subs.deb.: general'
                                Lib.AP.SAP.SAPQuery(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "T163B", "BEWTP|TBTKZ|PRSPR", "BEWTP = 'X'", 0, 0, false);
                            }
                            else {
                                callback(true);
                            }
                        };
                        /**
                        * compute the tolerance key depending on input params
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        * @returns {string}
                        */
                        LogisticVerification.prototype.AmounCheckGetToleranceKey = function (input) {
                            var toleranceKey = "PP";
                            if (input.UpdateDeliveryCosts) {
                                toleranceKey = "KW";
                            }
                            else if (input.IsEstimatedPrice) {
                                toleranceKey = "PS";
                            }
                            return toleranceKey;
                        };
                        /**
                        * compute the value to compare for amount check in Debit mode
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        * @param {string} toleranceKey used for specific conditioning
                        * @returns {number|null} return null if an error occurs, otherwise, the computed value
                        */
                        LogisticVerification.prototype.AmountCheckGetValue = function (language, input, toleranceKey) {
                            var currentValue = input.Amount;
                            if (!input.NoQuantity) {
                                // Tolerance key condition value (BNK)
                                if (toleranceKey === "KW") {
                                    if (input.SubsequentDebitCredit && input.InvoicedQuantity !== 0) {
                                        currentValue = (input.Amount + input.InvoicedAmount) / input.InvoicedQuantity * input.Quantity;
                                    }
                                }
                                else if (input.SubsequentDebitCredit) {
                                    if (input.InvoicedQuantity < input.Quantity) {
                                        // Quantity entered larger than quantity to be debited
                                        this.AddCustomizedMessage("M8", "074", "E", language, "", "", "", "");
                                        currentValue = null;
                                    }
                                    else {
                                        currentValue = input.Amount + ((input.InvoicedAmount * input.Quantity) / input.InvoicedQuantity);
                                        if (!this.CheckMaximumValue(currentValue, language, "Amount_Check")) {
                                            currentValue = null;
                                        }
                                    }
                                }
                            }
                            return currentValue;
                        };
                        /**
                        * compute the comparison value for amount check in Debit mode
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        * @param {string} toleranceKey used for specific conditioning
                        * @returns {number|null} return null if an error occurs, otherwise, the comparison value
                        */
                        LogisticVerification.prototype.AmountCheckGetComparisonValue = function (language, input, toleranceKey) {
                            var comparisonValue;
                            if (!input.NoQuantity) {
                                // Tolerance key condition value and old process
                                if (toleranceKey === "KW" && !input.NewInputValues && input.ConversionDenominator === input.ConversionNumerator) {
                                    comparisonValue = input.NetValue / input.OrderedQuantity * input.Quantity;
                                }
                                // Tolerance key price variance or BNK and new process
                                else {
                                    comparisonValue = input.NetValue / (input.OrderedQuantity * input.ConversionNumerator / input.ConversionDenominator) * input.QuantityInPOUnit;
                                }
                                if (!this.CheckMaximumValue(comparisonValue, language, "Amount_Check")) {
                                    comparisonValue = null;
                                }
                            }
                            // Allowed after load in service order only after the invoice
                            else if (input.SubsequentDebitCredit && input.InvoicedQuantity > 0 && input.IsGoodReceipt && !input.GRNonValuated && input.ItemCategory === "9") {
                                // Subsequent debit/credit not allowed before invoice posting
                                this.AddCustomizedMessage("M8", "314", "E", language, "", "", "", "");
                                comparisonValue = null;
                            }
                            else if (input.ItemCategory === "1") {
                                // Blanket Positions - no check here
                                comparisonValue = null;
                            }
                            else {
                                if (input.IsGoodReceipt && !input.GRNonValuated) {
                                    // GR assessable
                                    comparisonValue = input.AcceptedNetValue - input.InvoicedAmount;
                                }
                                else {
                                    comparisonValue = input.NetValue - input.InvoicedAmount;
                                }
                                if (comparisonValue < 0) {
                                    comparisonValue = 0;
                                }
                            }
                            return comparisonValue;
                        };
                        /**
                        * call ToleranceCheck if required and add messages to CustomizedMessages list according to results.
                        */
                        LogisticVerification.prototype.AmountCheckTolerance = function (callback, language, input, currentValue, comparisonValue, toleranceKey) {
                            var that = this;
                            function toleranceCheckCallback(toleranceCheck) {
                                var strAmount = Sys.Helpers.SAP.ConvertToDecimalFormat(toleranceCheck.Amount);
                                var strPercent = Sys.Helpers.SAP.ConvertToDecimalFormat(toleranceCheck.Percent);
                                var msgnr;
                                switch (toleranceCheck.ReturnType + toleranceCheck.ReturnCode) {
                                    // Below the amount
                                    case "A1":
                                        msgnr = input.ReturnsItem ? "480" : "084";
                                        // Price too low (below tolerance limit of & &)
                                        that.AddCustomizedMessage("M8", msgnr, "W", language, strAmount, input.CurrencyKey, "", "");
                                        break;
                                    // exceeded amount
                                    case "A2":
                                        msgnr = input.ReturnsItem ? "478" : "082";
                                        // Price too high (tolerance limit of & & exceeded)
                                        that.AddCustomizedMessage("M8", msgnr, "W", language, strAmount, input.CurrencyKey, "", "");
                                        break;
                                    // Percent below
                                    case "P1":
                                        msgnr = input.ReturnsItem ? "481" : "085";
                                        // Price too low (below tolerance limit of & %)
                                        that.AddCustomizedMessage("M8", msgnr, "W", language, strPercent, "", "", "");
                                        break;
                                    // exceeded percent
                                    case "P2":
                                        msgnr = input.ReturnsItem ? "479" : "083";
                                        // Price too high (tolerance limit of & % exceeded)
                                        that.AddCustomizedMessage("M8", msgnr, "W", language, strPercent, "", "", "");
                                        break;
                                    default:
                                        break;
                                }
                                callback();
                            }
                            if (input.ReturnsItem || !input.SubsequentDebitCredit || input.Amount <= 0) {
                                this.ToleranceCheck(toleranceCheckCallback, currentValue, comparisonValue, input.CompanyCode, toleranceKey, true, "", input.CurrencyKey, input.TranslationDate, 0);
                            }
                            else {
                                callback();
                            }
                        };
                        /**
                        * check the amount in case of Debit
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        */
                        LogisticVerification.prototype.AmountCheckDebit = function (callback, language, input) {
                            var that = this;
                            function amountCheckPOHistoryCallback(checkPrice) {
                                if (checkPrice) {
                                    var toleranceKey = that.AmounCheckGetToleranceKey(input);
                                    var currentValue = that.AmountCheckGetValue(language, input, toleranceKey);
                                    var comparisonValue = that.AmountCheckGetComparisonValue(language, input, toleranceKey);
                                    if (currentValue && comparisonValue) {
                                        // current value / reference value exchange in return
                                        if (input.ReturnsItem) {
                                            var tmp = currentValue;
                                            currentValue = comparisonValue;
                                            comparisonValue = tmp;
                                        }
                                        that.AmountCheckTolerance(callback, language, input, currentValue, comparisonValue, toleranceKey);
                                        return;
                                    }
                                }
                                callback();
                            }
                            this.AmountCheckPOHistory(amountCheckPOHistoryCallback, language, input);
                        };
                        /**
                        * check the amount in case of Credit
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        */
                        LogisticVerification.prototype.AmountCheckCredit = function (callback, language, input) {
                            if (!input.NoQuantity) {
                                if (input.Quantity > input.InvoicedQuantity) {
                                    // do not deal with quantity above invoiced quantity in Credit mode
                                    callback();
                                    return;
                                }
                                else if (!input.SubsequentDebitCredit && input.Amount !== input.InvoicedAmount) {
                                    if (input.ReturnsItem) {
                                        // Reverse entry value set automatically for full reversal
                                        this.AddCustomizedMessage("M8", "474", "I", language, "", "", "", "");
                                        callback();
                                        return;
                                    }
                                    // Reverse entry value set automatically for full reversal
                                    this.AddCustomizedMessage("M8", "077", "I", language, "", "", "", "");
                                    callback();
                                    return;
                                }
                            }
                            if (input.Amount > input.InvoicedAmount) {
                                // for most of the case we check Amount greater than ForeignInvoicedAmount
                                if (input.ReturnsItem) {
                                    // Reverse value greater than value credited so far
                                    this.AddCustomizedMessage("M8", "475", "E", language, "", "", "", "");
                                }
                                else {
                                    // Reversal value greater than value invoiced to date
                                    this.AddCustomizedMessage("M8", "079", "E", language, "", "", "", "");
                                }
                            }
                            callback();
                        };
                        /**
                        * Check if amounts is valid according to settings from SAP
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPAmountCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInputInput())
                        */
                        LogisticVerification.prototype.AmountCheck = function (callback, language, input) {
                            if (this.IsDebit(input)) {
                                this.AmountCheckDebit(callback, language, input);
                            }
                            else {
                                this.AmountCheckCredit(callback, language, input);
                            }
                        };
                        /**
                        * Compute the message number and type depending on arguments
                        * @param {boolean} isGoodsInvoice indicator of goods invoice/service
                        * @param {boolean} isPlannedDeliveryCosts indicator of planned delivery costs (Incoming Invoice, Header Data)
                        * @param {boolean} checkItemsPosition indicator of check items position
                        * @param {boolean} bSupplier indicator of supplier selection check
                        * @returns {object} Number and Type as member of an object
                        */
                        LogisticVerification.prototype.GetCreditorMessage = function (isGoodsInvoice, isPlannedDeliveryCosts, checkItemsPosition, bSupplier) {
                            var message = { Number: "", Type: "" };
                            // Set the error numbers and type
                            if (isGoodsInvoice) {
                                message.Type = bSupplier ? "-" : "W";
                                if (isPlannedDeliveryCosts) {
                                    // Invoice with delivery costs
                                    if (checkItemsPosition) {
                                        // Position
                                        // 293 : Different order vendor in PO
                                        // 288: Different invoicing party planned in purchase order
                                        message.Number = bSupplier ? "293" : "288";
                                    }
                                    else {
                                        // Delivery Costs position
                                        // 294: Different order vendor for delivery costs item in PO
                                        // 289: Different invoicing party planned for del. costs item in PO
                                        message.Number = bSupplier ? "294" : "289";
                                    }
                                }
                                else {
                                    // invoice
                                    // 291: Different order vendor in PO
                                    // 286: Different invoicing party planned in purchase order
                                    message.Number = bSupplier ? "291" : "286";
                                }
                            }
                            else if (isPlannedDeliveryCosts) {
                                // Invoice for delivery costs
                                // 292: Different order vendor for delivery costs item in PO
                                // 287: Different invoicing party planned for del. costs item in PO
                                message.Number = bSupplier ? "292" : "287";
                                message.Type = bSupplier ? "-" : "E";
                            }
                            return message;
                        };
                        /**
                        * Helpers for getting creditor's specific message from SAP and adding it to the CustomizedMessages list
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPCreditorCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetCreditorCheckInput())
                        * @param {string} param a parameter to customize the message returned by SAP
                        */
                        LogisticVerification.prototype.CreditorCheckSupplierAddMessage = function (language, input, param) {
                            var message = this.GetCreditorMessage(input.IsGoodsInvoice, input.IsPlannedDeliveryCosts, input.CheckItemsPosition, true);
                            this.AddCustomizedMessage("M8", message.Number, message.Type, language, param, input.PONumber, input.InvoiceHeaderVendor, "");
                        };
                        /**
                        * Perform the check of supplier selection. If required messages are added to the CustomizedMessages list
                        * Usually this method is not call directly but through the CreditorCheck check method.
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPCreditorCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetCreditorCheckInput())
                        */
                        LogisticVerification.prototype.CreditorCheckSupplierSelection = function (language, input) {
                            var bAddMessage = false;
                            // Check selection Supplier
                            if (input.CheckVendor && input.InvoiceHeaderVendor.length > 0) {
                                // Check selection Supplier of delivery items
                                if (input.CheckItemsPosition) {
                                    // Supplier selection always check against best supplier
                                    bAddMessage = input.InvoiceHeaderVendor !== input.Vendor;
                                }
                                else {
                                    // Check selection Supplier of BNK positions
                                    switch (input.DeliveryCostSelectionType) {
                                        // condition on supplier
                                        case "1":
                                            bAddMessage = input.InvoiceHeaderVendor !== input.PODocHeaderInvoicingParty;
                                            break;
                                        // condition on order
                                        case "2":
                                            bAddMessage = input.InvoiceHeaderVendor !== input.Vendor;
                                            break;
                                        // condition on both
                                        case "3":
                                            bAddMessage = input.InvoiceHeaderVendor !== input.Vendor || input.InvoiceHeaderVendor !== input.PODocHeaderInvoicingParty;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }
                            if (bAddMessage) {
                                var param1 = input.DeliveryCostSelectionType === "1" ? input.PODocHeaderInvoicingParty : input.Vendor;
                                this.CreditorCheckSupplierAddMessage(language, input, param1);
                            }
                            return !bAddMessage;
                        };
                        /**
                        * Perform the check on Creditor. If required messages are added to the CustomizedMessages list
                        * @param {string} language the language used when getting message from SAP
                        * @param {SAPCreditorCheckInput} input configuration used for checking (usually from Lib.AP.SAP.Invoice.Logistic.GetCreditorCheckInput())
                        */
                        LogisticVerification.prototype.CreditorCheck = function (language, input) {
                            // Check Allocation Indicator
                            if (input.IsGoodsInvoice || input.IsPlannedDeliveryCosts) {
                                //Set the billing / condition supplier
                                var elifre = input.PODocHeaderInvoicingParty;
                                if (elifre.length === 0) {
                                    elifre = input.Vendor;
                                }
                                if (this.CreditorCheckSupplierSelection(language, input) && input.CheckInvoicingParty && input.InvoiceHeaderInvoicingParty !== elifre) {
                                    // if no error/warning on supplier selection check the creditor
                                    var message = this.GetCreditorMessage(input.IsGoodsInvoice, input.IsPlannedDeliveryCosts, input.CheckItemsPosition, false);
                                    this.AddCustomizedMessage("M8", message.Number, message.Type, language, elifre, input.PONumber, input.InvoiceHeaderInvoicingParty, "");
                                }
                            }
                            else {
                                this.AddCustomizedMessage("M8", "533", "E", language, "", "", "", "");
                            }
                        };
                        return LogisticVerification;
                    }());
                    Logistic.LogisticVerification = LogisticVerification;
                    function GetLogisticVerification() {
                        return new LogisticVerification();
                    }
                    Logistic.GetLogisticVerification = GetLogisticVerification;
                    function GetQuantityCheckInput(params, item, quantity) {
                        return new SAPQuantityCheckInput(params, item, quantity);
                    }
                    Logistic.GetQuantityCheckInput = GetQuantityCheckInput;
                    function GetAmountCheckInput(params, item, quantity, amount, entrySheetValue) {
                        return new SAPAmountCheckInput(params, item, quantity, amount, entrySheetValue);
                    }
                    Logistic.GetAmountCheckInput = GetAmountCheckInput;
                    function GetCreditorCheckInput(item, poNumber, vendor) {
                        return new SAPCreditorCheckInput(item, poNumber, vendor);
                    }
                    Logistic.GetCreditorCheckInput = GetCreditorCheckInput;
                })(Logistic = Invoice.Logistic || (Invoice.Logistic = {}));
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
