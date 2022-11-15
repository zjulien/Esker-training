/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_P2P_Conversation_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_Purchasing.Base_V12.0.461.0",
    "Lib_Purchasing.Workflow_V12.0.461.0",
    "[Lib_Custom_Parameters]",
    "[Lib_P2P_Custom_Parameters]",
    "Sys/Sys_Parameters",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_TechnicalData",
    "[Lib_Workflow_Customization_Common]"
  ]
}*/
/**
 * helpers for purchasing package
 * @namespace Lib.Purchasing
 */
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var g = Sys.Helpers.Globals; // STD Globals Object
        Purchasing.AddLib = Lib.AddLib;
        Purchasing.ExtendLib = Lib.ExtendLib;
        /**
         * Create a next alert to advise user when we try to execute an unknown action.
         * Process will be in validation state and wait for an action of user.
         * @param {string} currentAction name of the executed action
         * @param {string} currentName sub-name of the executed action
         */
        function OnUnknownAction(currentAction, currentName) {
            OnUnexpectedError("Ignoring unknown action " + currentAction + "-" + currentName);
        }
        Purchasing.OnUnknownAction = OnUnknownAction;
        /**
         * Create a next alert to advise user when we have any issue.
         * Process will be in validation state and wait for an action of user.
         * @param {string} err message of error
         */
        function OnUnexpectedError(err) {
            Log.Error(err);
            Lib.CommonDialog.NextAlert.Define("_Unexpected error", "_Unexpected error message", {
                isError: true,
                behaviorName: "onUnexpectedError"
            });
            if (Sys.ScriptInfo.IsServer()) {
                g.Process.PreventApproval();
            }
        }
        Purchasing.OnUnexpectedError = OnUnexpectedError;
        function ResetAllFieldsInError() {
            if (Sys.ScriptInfo.IsClient()) {
                Sys.Helpers.Object.ForEach(g.Controls, function (control) {
                    // header fields
                    if (Sys.Helpers.IsFunction(control.GetError) && control.GetError()) {
                        control.SetError("");
                    }
                    // Table case
                    if (Sys.Helpers.IsFunction(control.GetLineCount)) {
                        // retrieve column names
                        var nbColumns = control.GetColumnCount();
                        var columnsNames = [];
                        for (var i = 1; i <= nbColumns; i++) {
                            columnsNames.push(control.GetColumnControl(i).GetName());
                        }
                        // reset on Data rather than TableRow because we want reset every line (visible and not visible)
                        var nbItems = control.GetItemCount();
                        var _loop_2 = function (i) {
                            var item = control.GetItem(i);
                            columnsNames.forEach(function (fieldName) {
                                if (item.GetError(fieldName)) {
                                    item.SetError(fieldName, "");
                                }
                            });
                        };
                        for (var i = 0; i < nbItems; i++) {
                            _loop_2(i);
                        }
                    }
                });
            }
            else {
                var fieldsInError = Data.GetFieldsInError();
                if (fieldsInError.nbErrors > 0) {
                    fieldsInError.fields.forEach(function (fieldName) {
                        Data.SetError(fieldName, "");
                    });
                    for (var tableName in fieldsInError.tables) {
                        var table = Data.GetTable(tableName);
                        var _loop_1 = function (row) {
                            var item = table.GetItem(parseFloat(row));
                            fieldsInError.tables[tableName].rows[row].forEach(function (rowFieldName) {
                                item.SetError(rowFieldName, "");
                            });
                        };
                        for (var row in fieldsInError.tables[tableName].rows) {
                            _loop_1(row);
                        }
                    }
                }
            }
        }
        Purchasing.ResetAllFieldsInError = ResetAllFieldsInError;
        /**
         * Remove error or warning on each cell of column of table.
         */
        function ResetAllCellsInState(tableName, columnName, state) {
            var table = Data.GetTable(tableName);
            var nItems = table.GetItemCount();
            for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                var item = table.GetItem(itemIdx);
                item["Set" + state].call(item, columnName, "");
            }
        }
        Purchasing.ResetAllCellsInState = ResetAllCellsInState;
        function SetDocumentReadonlyAndHideAllButtonsExceptQuit(quitButtonName) {
            if (Sys.ScriptInfo.IsClient()) {
                Sys.Helpers.Object.ForEach(g.Controls, function (control) {
                    var type = control.GetType();
                    if (type.startsWith("Panel")) {
                        control.SetReadOnly(true);
                    }
                    else if (type === "FormButton") {
                        control.SetDisabled(true);
                    }
                    else if (type === "SubmitButton") {
                        control.Hide(true);
                    }
                });
                quitButtonName = quitButtonName || "Close";
                var quitButton = g.Controls[quitButtonName];
                if (quitButton) {
                    quitButton.SetDisabled(false);
                    quitButton.Hide(false);
                }
                else {
                    Log.Error("Unable to find the quit button named: " + quitButtonName);
                }
            }
        }
        Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit = SetDocumentReadonlyAndHideAllButtonsExceptQuit;
        Purchasing.delimitersThousandsLocales = {
            // default works for en-US, en-GB, it-IT
            "default": ",",
            "fr-FR": " ",
            "fr-CH": "'",
            "de-DE": ".",
            "es-ES": "."
        };
        Purchasing.delimitersDecimalLocales = {
            // default works for en-US, en-GB, it-IT, fr-CH
            "default": ".",
            "fr-FR": ",",
            "de-DE": ",",
            "es-ES": ","
        };
        function FeedJsonWithCustomTable(tableName, tableValues, info) {
            var result = [];
            var table = Data.GetTable(tableName);
            if (tableName === "LineItems__") {
                Lib.Purchasing.RemoveEmptyLineItem(table);
            }
            var nItems = table.GetItemCount();
            var _loop_3 = function (itemIdx) {
                var item = table.GetItem(itemIdx);
                var itemInfo = Sys.Helpers.Extend(true, {}, info, {
                    tableName: tableName,
                    table: table,
                    itemIdx: itemIdx,
                    item: item
                });
                // build a json for the current line item
                var jsonDataForItemIdxFields = {};
                // loop on all columns of the line item
                Sys.Helpers.Object.ForEach(tableValues.fields || {}, function (data) {
                    // keep original variable type
                    var dataValue = Sys.Helpers.IsFunction(data) ? data(itemInfo) : item.GetValue(data);
                    // except for Date type where we always set as a string with "YYYY-MM-DD" format
                    if (dataValue instanceof Date) {
                        dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                    }
                    jsonDataForItemIdxFields[data] = dataValue;
                });
                result.push(jsonDataForItemIdxFields);
            };
            for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                _loop_3(itemIdx);
            }
            return result;
        }
        Purchasing.FeedJsonWithCustomTable = FeedJsonWithCustomTable;
        function LoadParameters() {
            // !!! Add used parameters libs (Lib_Parameters_P2P, Lib_Custom_Parameters) in LIB_DEFINITION.required
            // to ensure that the instance names are registed in Sys.Parameters.
            return Sys.Parameters.IsReady();
        }
        Purchasing.LoadParameters = LoadParameters;
        function SetERPByCompanyCode(companyCode) {
            return Lib.P2P.CompanyCodesValue.QueryValues(companyCode).Then(function (CCValues) {
                var configurationName = "Default";
                if (Object.keys(CCValues).length > 0) {
                    configurationName = CCValues.DefaultConfiguration__;
                }
                else {
                    Log.Error("The requested company code is not in the company code table.");
                }
                return Lib.P2P.ChangeConfiguration(configurationName)
                    .Then(function () {
                    Lib.ERP.InitERPName(null, true, "AP");
                    InitTechnicalFields(true);
                });
            });
        }
        Purchasing.SetERPByCompanyCode = SetERPByCompanyCode;
        function InitTechnicalFields(force, archive) {
            if (archive === void 0) { archive = true; }
            // Serialize ERP
            Lib.ERP.InitERPName(null, force, "PAC");
            // Serialize Parameters for PAC instance
            Sys.Parameters.GetInstance("P2P").Serialize(force);
            Sys.Parameters.GetInstance("PAC").Serialize(force);
            var promises = [];
            promises.push(Lib.P2P.InitValidityDateTime("PAC"));
            if (archive) {
                promises.push(Lib.P2P.InitArchiveDuration("PAC"));
            }
            return Sys.Helpers.Promise.All(promises);
        }
        Purchasing.InitTechnicalFields = InitTechnicalFields;
        /**
         * Formats a number with a template.
         * In the template, the string "$seq$" is replaced by the given number with 5 figures, padded with zeroes
         * Exemple: FormatSequenceNumber("1234$seq$", 56) => "123400056"
         */
        function FormatSequenceNumber(sequenceNumber, templateStringName) {
            return Sys.Parameters.GetInstance("PAC").GetParameter(templateStringName).replace("$seq$", Sys.Helpers.String.PadLeft(sequenceNumber, "0", 5));
        }
        Purchasing.FormatSequenceNumber = FormatSequenceNumber;
        function FormatNumber(value, format, delimitersThousands, delimitersDecimal) {
            var negP = false, signed = false, neg = false;
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf("(") > -1) {
                negP = true;
                format = format.slice(1, -1);
            }
            else if (format.indexOf("+") > -1) {
                signed = true;
                format = format.replace(/\+/g, "");
            }
            var d = "";
            var w = value.toString().split(".")[0];
            var precision = format.split(".")[1];
            var thousands = format.indexOf(",");
            if (precision) {
                d = value.toFixed(precision.length);
                w = d.split(".")[0];
                if (d.split(".")[1].length) {
                    d = delimitersDecimal + d.split(".")[1];
                }
                else {
                    d = "";
                }
            }
            else {
                w = value.toFixed();
            }
            // format number
            if (w.indexOf("-") > -1) {
                w = w.slice(1);
                neg = true;
            }
            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + delimitersThousands);
            }
            if (format.indexOf(".") === 0) {
                w = "";
            }
            return (negP && neg ? "(" : "") + (!negP && neg ? "-" : "") + (!neg && signed ? "+" : "") + w + d + (negP && neg ? ")" : "");
        }
        Purchasing.FormatNumber = FormatNumber;
        function NextNumber(type, fieldNumber) {
            var errorMsg = {
                "PR": "_Error while retrieving a new requisition number",
                "PO": "_Error while retrieving a new PO number",
                "GR": "_Error while retrieving a new GR number",
                "PICKUP": "_Error while retrieving a new PICKUP number",
                "RO": "_Error while retrieving a new RO number",
                "EPOR": "_Error while retrieving a new EPOR number"
            };
            var sequenceName = {
                "PR": "ReqNum",
                "PO": "ReqNumPO",
                "GR": "ReqNumGR",
                "PICKUP": "ReqNumGR",
                "RO": "ReqNumRO",
                "EPOR": "ReqNumEPOR"
            };
            var numberFormat = {
                "PR": "NumberFormat",
                "PO": "NumberFormatPO",
                "GR": "NumberFormatGR",
                "PICKUP": "NumberFormatGR",
                "RO": "NumberFormatRO",
                "EPOR": "NumberFormatEPOR"
            };
            var sNumber = "";
            var GetNumberFunc = Sys.Helpers.TryGetFunction("Lib." + type + ".Customization.Server.GetNumber");
            if (GetNumberFunc) {
                sNumber = GetNumberFunc(sequenceName[type]);
                if (!sNumber) {
                    Data.SetError(fieldNumber, errorMsg[type]);
                    Log.Info("Error while retrieving a new " + type + " number");
                }
                else {
                    Log.Info(type + " number:" + sNumber);
                }
            }
            else {
                var ReqNumberSequence = Process.GetSequence(sequenceName[type]);
                sNumber = ReqNumberSequence.GetNextValue();
                if (sNumber === "") {
                    Data.SetError(fieldNumber, errorMsg[type]);
                    Log.Info("Error while retrieving a new " + type + " number");
                }
                else {
                    sNumber = Lib.Purchasing.FormatSequenceNumber(sNumber, numberFormat[type]);
                    Log.Info(type + " number:" + sNumber);
                }
            }
            return sNumber;
        }
        Purchasing.NextNumber = NextNumber;
        function NumberToLocaleString(value, format, locales) {
            // eslint-disable-next-line dot-notation
            var delimitersThousands = String(this.delimitersThousandsLocales[locales] || this.delimitersThousandsLocales["default"]);
            // eslint-disable-next-line dot-notation
            var delimitersDecimal = String(this.delimitersDecimalLocales[locales] || this.delimitersDecimalLocales["default"]);
            return Lib.Purchasing.FormatNumber(value, format, delimitersThousands, delimitersDecimal);
        }
        Purchasing.NumberToLocaleString = NumberToLocaleString;
        function BuildCSVHeader(headers) {
            return headers.join(";") + "\n";
        }
        Purchasing.BuildCSVHeader = BuildCSVHeader;
        function BuildCSVLine(items) {
            return items.map(function (entry) {
                if (entry) {
                    return '"' + Sys.Helpers.String.EscapeValueForCSV(entry.toString()) + '"';
                }
                return '""';
            }).join(";");
        }
        Purchasing.BuildCSVLine = BuildCSVLine;
        function GetNumberAsString(value, culture, precision, precisionMin) {
            precision = Sys.Helpers.IsDefined(precision) ? precision : 2;
            precisionMin = Sys.Helpers.IsDefined(precisionMin) ? precisionMin : Math.min(2, precision);
            var currentPrecision = new Sys.Decimal(new Sys.Decimal(value || 0).toFixed(precision || 0)).decimalPlaces();
            var fmt = "000,000." + Sys.Helpers.String.RepeatChar("0", Math.max(precisionMin, currentPrecision));
            return Lib.Purchasing.NumberToLocaleString(value, fmt, culture);
        }
        Purchasing.GetNumberAsString = GetNumberAsString;
        function GetValueAsString(item, field, culture) {
            var value = item.GetValue(field);
            if (value instanceof Date) {
                return Sys.Helpers.Date.ToLocaleDate(value, culture);
            }
            if (typeof value === "number") {
                var precision = // let it undefined - default value will be set by GetNumberAsString function
                 void 0; // let it undefined - default value will be set by GetNumberAsString function
                if (Sys.ScriptInfo.IsServer()) {
                    var properties = item.GetProperties(field);
                    if (properties) {
                        precision = properties.precision;
                    }
                }
                return Lib.Purchasing.GetNumberAsString(value, culture, precision);
            }
            if (typeof value === "string") {
                return value;
            }
            return value;
        }
        Purchasing.GetValueAsString = GetValueAsString;
        //Keep It Here for backward compatibility
        function GetOwner() {
            return Lib.P2P.GetOwner();
        }
        Purchasing.GetOwner = GetOwner;
        //Keep It Here for backward compatibility
        function GetValidator() {
            return Lib.P2P.GetValidator();
        }
        Purchasing.GetValidator = GetValidator;
        //Keep It Here for backward compatibility
        function GetValidatorOrOwner() {
            return Lib.P2P.GetValidatorOrOwner();
        }
        Purchasing.GetValidatorOrOwner = GetValidatorOrOwner;
        //Keep It Here for backward compatibility
        function GetValidatorOrOwnerLogin() {
            return Lib.P2P.GetValidatorOrOwnerLogin();
        }
        Purchasing.GetValidatorOrOwnerLogin = GetValidatorOrOwnerLogin;
        //Keep It Here for backward compatibility
        function AddOnBehalfOf(currentContributor, comment) {
            return Lib.P2P.AddOnBehalfOf(currentContributor, comment);
        }
        Purchasing.AddOnBehalfOf = AddOnBehalfOf;
        function SetRightForP2PSupervisor(usersWithRight) {
            if (usersWithRight === void 0) { usersWithRight = null; }
            Sys.Parameters.GetInstance("PAC").IsReady(function () {
                var login = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("PAC").GetParameter("P2PSupervisorLogin"));
                if (login) {
                    Log.Info("Grant read right to Supervisor: " + login);
                    Process.AddRight(login, "read"); // SetRight ?
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(login) === -1) {
                        usersWithRight.push(login);
                    }
                }
            });
        }
        Purchasing.SetRightForP2PSupervisor = SetRightForP2PSupervisor;
        function SetRightForProcurementViewer(usersWithRight) {
            if (usersWithRight === void 0) { usersWithRight = null; }
            Sys.Parameters.GetInstance("PAC").IsReady(function () {
                var login = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("PAC").GetParameter("ProcurementViewer"));
                if (login) {
                    Log.Info("Grant read right to procurement viewer: " + login);
                    Process.AddRight(login, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(login) === -1) {
                        usersWithRight.push(login);
                    }
                }
            });
        }
        Purchasing.SetRightForProcurementViewer = SetRightForProcurementViewer;
        function SetRightForWarehouseManager(usersWithRight) {
            if (usersWithRight === void 0) { usersWithRight = null; }
            var companyCode = Data.GetValue("CompanyCode__");
            var buyerLogins = {};
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                    Lib.P2P.Inventory.Warehouse.GetWarehouse(companyCode, item.GetValue("WarehouseID__"))
                        .Then(function (warehouse) {
                        buyerLogins[warehouse.warehouseManagerLogin] = warehouse.warehouseManagerLogin;
                    });
                }
            });
            for (var buyerLogin in buyerLogins) {
                if (Object.prototype.hasOwnProperty.call(buyerLogins, buyerLogin)) {
                    Log.Info("Grant read right to warehouse manager : " + buyerLogin);
                    Process.AddRight(buyerLogin, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(buyerLogin) === -1) {
                        usersWithRight.push(buyerLogin);
                    }
                }
            }
        }
        Purchasing.SetRightForWarehouseManager = SetRightForWarehouseManager;
        function SetRightForContractOwner(usersWithRight) {
            if (usersWithRight === void 0) { usersWithRight = null; }
            var contractNumbers = {};
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                var contractNumber = item.GetValue("ContractNumber__");
                if (contractNumber) {
                    contractNumbers[contractNumber] = contractNumber;
                }
            });
            var distinctArrayContractNumbers = [];
            Object.keys(contractNumbers).map(function (key) {
                distinctArrayContractNumbers.push(key);
            });
            var queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("ReferenceNumber__", distinctArrayContractNumbers), Sys.Helpers.LdapUtil.FilterEqual("ContractStatus__", "Active"));
            var table = "CDNAME#P2P - Contract";
            var contractQueryOptions = {
                table: table,
                filter: queryFilter.toString(),
                attributes: ["OwnerLogin__"],
                maxRecords: distinctArrayContractNumbers.length,
                additionalOptions: {
                    asAdmin: true,
                    queryOptions: "distinct=1"
                }
            };
            Sys.GenericAPI.PromisedQuery(contractQueryOptions)
                .Then(function (result) {
                result.forEach(function (owner) {
                    Process.AddRight(owner.OwnerLogin__, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(owner.OwnerLogin__) === -1) {
                        usersWithRight.push(owner.OwnerLogin__);
                    }
                });
            });
        }
        Purchasing.SetRightForContractOwner = SetRightForContractOwner;
        Purchasing.URL = {
            AddParameter: function (url, name, value) {
                return url + (url.indexOf("?") < 0 ? "?" : "&") + encodeURIComponent(name) + "=" + encodeURIComponent(value);
            },
            RemoveParameter: function (url, name) {
                return url.replace(new RegExp("(\\?|&)" + encodeURIComponent(name) + "=([^&]+)(&?)", "gi"), function (match, p1, p2, p3 /*, offset, string*/) {
                    if (p1 === "?") {
                        return p1;
                    }
                    return p3;
                });
            }
        };
        var FieldReseter = /** @class */ (function () {
            function FieldReseter() {
                this.fieldsToReset = [];
            }
            /**
             * Push an item to reset.
             * Item must be
             *	{"table" : "tableName", "field": "fieldName"}
             * OR
             *	{"field": "fieldName"}
             */
            FieldReseter.prototype.push = function (item) {
                if (item.field) {
                    this.fieldsToReset.push(item);
                }
            };
            FieldReseter.prototype.Clean = function () {
                for (var i = 0; i < this.fieldsToReset.length; i++) {
                    if (this.fieldsToReset[i].table) {
                        var table = g.Data.GetTable(this.fieldsToReset[i].table);
                        for (var idx = 0; idx < table.GetItemCount(); idx++) {
                            var row = table.GetItem(idx);
                            row.SetValue(this.fieldsToReset[i].field, null);
                        }
                    }
                    else {
                        g.Data.SetValue(this.fieldsToReset[i].field, null);
                    }
                }
            };
            return FieldReseter;
        }());
        Purchasing.FieldReseter = FieldReseter;
        Purchasing.ConversationTypes = {
            GeneralInformation: "10",
            ItemReception: "20",
            Viewed: "30",
            Modified: "40",
            Dialog: "50" // All "human" dialog
        };
        /**
         * Add message to a conversation
         * @param msg
         * @param type
         * @param {boolean} notifyByEmail
         * @param {string} orderNumber order number inserted in email template. Used if notifyByEmail is enabled
         * @param asUser
         * @param {string} redirectionPortalUserAddress email replacing portal user's email. Used if notifyByEmail is enabled
         */
        function AddConversationItem(msg, type, notifyByEmail, orderNumber, asUser, redirectionPortalUserAddress) {
            var options = {
                ignoreIfExists: false,
                emailTemplate: "Event_MissedPurchasingItem.htm",
                asUser: asUser || null
            };
            if (notifyByEmail) {
                // Keep default notifyByEmail from conversation parties
                options.emailCustomTags = {
                    OrderNumber__: orderNumber !== null && typeof orderNumber !== "undefined" ? orderNumber : g.Data.GetValue("OrderNumber__"),
                    Message__: msg
                };
                if (redirectionPortalUserAddress) {
                    options.portalUserRedirectionEmailAddress = redirectionPortalUserAddress;
                }
            }
            else {
                // Disable email notification for this message
                options.notifyByEmail = false;
            }
            g.Conversation.AddItem(Lib.P2P.Conversation.TableName, { Type: type, Message: msg }, options);
        }
        Purchasing.AddConversationItem = AddConversationItem;
        Purchasing.RequestedDeliveryDate = {
            IsReadOnly: function (currentRole) {
                return !Lib.Purchasing.IsRequester(currentRole);
            },
            IsRequired: function (currentRole) {
                return currentRole === Lib.Purchasing.roleRequester;
            }
        };
        function GetVendor(poData, email) {
            return Lib.Purchasing.Vendor.GetVendorContact(poData, email);
        }
        Purchasing.GetVendor = GetVendor;
        /**
         * This method calculates either the payment amount or the payment percentage from the defined input (either paymentPercent or paymentAmount)
         * and the downPaymentLocalCurrency.
         * If both paymentAmount and paymentPercent are defined, paymentPercent is ignored
         * Returns: { paymentAmount: xx, paymentPercent: xx, downPaymentLocalCurrency: xx }
         */
        function CalculateDownPayment(totalNetAmount, paymentAmount, paymentPercent, exchangeRate) {
            var res = {
                PaymentAmount: 0,
                PaymentPercent: 0,
                DownPaymentLocalCurrency: null
            };
            if (paymentAmount) {
                res.PaymentAmount = paymentAmount;
                res.PaymentPercent = new Sys.Decimal(paymentAmount).mul(100).div(totalNetAmount).toNumber();
            }
            else if (paymentPercent) {
                res.PaymentAmount = new Sys.Decimal(totalNetAmount).mul(paymentPercent).div(100.0).toNumber();
                res.PaymentPercent = paymentPercent;
            }
            // Set Local currency Values
            if (!exchangeRate) {
                exchangeRate = 1;
            }
            res.DownPaymentLocalCurrency = new Sys.Decimal(res.PaymentAmount).mul(exchangeRate).toNumber();
            return res;
        }
        Purchasing.CalculateDownPayment = CalculateDownPayment;
        Purchasing.PRStatus = {
            ForPRWorkflow: ["To complete", "To review", "To approve", "Canceled", "Rejected"],
            ForPOWorkflow: ["To order"],
            ForDelivery: ["To receive", "Received"]
        };
        Purchasing.POStatus = {
            ForPOWorkflow: ["To order", "To pay"],
            ForDelivery: ["To receive", "Received", "Auto receive"]
        };
        /**
         * Helper for AutoCreateOrder user exit
         */
        Purchasing.autoCreateOrderEnabled = null;
        function IsAutoCreateOrderEnabled() {
            if (this.autoCreateOrderEnabled === null) {
                var enabled = Variable.GetValueAsString("AutoCreateOrderEnabled");
                if (!enabled) {
                    this.autoCreateOrderEnabled = !!Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.IsAutoCreateOrderEnabled");
                }
                else {
                    this.autoCreateOrderEnabled = Sys.Helpers.String.ToBoolean(enabled);
                }
            }
            return this.autoCreateOrderEnabled;
        }
        Purchasing.IsAutoCreateOrderEnabled = IsAutoCreateOrderEnabled;
        function IsMonoBuyer(table) {
            var firstBuyer = table.GetItem(0).GetValue("BuyerLogin__");
            for (var i = 0; i < table.GetItemCount(); i++) {
                var item = table.GetItem(i);
                var itemBuyer = item.GetValue("BuyerLogin__");
                if (!Sys.Helpers.IsEmpty(itemBuyer) && itemBuyer !== firstBuyer) {
                    return false;
                }
            }
            return true;
        }
        Purchasing.IsMonoBuyer = IsMonoBuyer;
        function IsAutoReceiveOrderEnabled() {
            return !!this.GetAutoReceiveOrderData();
        }
        Purchasing.IsAutoReceiveOrderEnabled = IsAutoReceiveOrderEnabled;
        Purchasing.autoReceiveOrderData = null;
        function GetAutoReceiveOrderData() {
            if (this.autoReceiveOrderData === null) {
                var data = Variable.GetValueAsString("AutoReceiveOrderData");
                if (!data) {
                    // Extract informations from custo lib (if exist)
                    data = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.IsAutoReceiveOrderEnabled");
                    // Check informations that we received from the custo lib
                    if (Sys.Helpers.IsBoolean(data) && data) // Did we set a boolean ? If yes, check that the boolean is explicity set to 'true' ?
                     {
                        Log.Info("Auto receive purchase order detected with boolean value 'true'");
                        data = {}; // Means that auto reception order is set to 'true' (enabled)
                    }
                    else if (!Sys.Helpers.IsPlainObject(data)) // Did we set a JSON ?
                     {
                        Log.Info("NO auto receive purchase order detected");
                        data = false;
                    }
                    else {
                        Log.Info("Auto receive purchase order detected with JSON object");
                    }
                }
                else {
                    data = JSON.parse(data);
                }
                var dataFromASN = Sys.TechnicalData.GetValue("autoCompleteFromASNData");
                if (dataFromASN) {
                    if (!data) {
                        data = {};
                    }
                    data.items = dataFromASN.items || [];
                    data.SourcePONumber = dataFromASN.SourcePONumber;
                    data.DeliveryNote = dataFromASN.DeliveryNote;
                    data.DeliveryDate = dataFromASN.DeliveryNote;
                    data.ASNNumber = dataFromASN.ASNNumber;
                }
                this.autoReceiveOrderData = data;
            }
            return this.autoReceiveOrderData;
        }
        Purchasing.GetAutoReceiveOrderData = GetAutoReceiveOrderData;
        function CheckMultipleBudgets(budgets) {
            var table = budgets.documentData.GetTable(budgets.sourceTypeConfig.formTable);
            var multipleBudgets = [];
            var _loop_4 = function (i) {
                var budgetID = budgets.byItemIndex[i];
                if (budgetID instanceof Lib.Budget.MultipleBudgetError) {
                    var error_1 = budgetID;
                    var detailsTrc = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                        return budgetColumn + "=" + error_1.budgetKeyColumns[budgetColumn];
                    }).join(", ");
                    Log.Warn("Impossible to find a unique budget for the item [" + i + "] : " + detailsTrc);
                    multipleBudgets.push(error_1);
                }
            };
            for (var i = 0; i < table.GetItemCount(); i++) {
                _loop_4(i);
            }
            if (multipleBudgets.length > 0) {
                return {
                    $error: "_Multiple budget error",
                    $params: multipleBudgets.join("\n")
                };
            }
            return {}; // OK!
        }
        Purchasing.CheckMultipleBudgets = CheckMultipleBudgets;
        var Treasurer = /** @class */ (function () {
            function Treasurer() {
                this.login = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("PAC").GetParameter("TreasurerLogin"));
                this.user = null;
                this.exists = null;
            }
            Treasurer.prototype.Exists = function (needUser) {
                if (this.exists === null || (needUser && this.user === null)) {
                    if (!Variable.GetValueAsString("TreasurerExists__") || needUser) {
                        this.user = g.Users.GetUser(this.login);
                        this.exists = this.user !== null;
                        Variable.SetValueAsString("TreasurerExists__", this.exists ? "true" : "false");
                    }
                    else {
                        this.exists = Variable.GetValueAsString("TreasurerExists__") === "true";
                    }
                    if (!this.exists) {
                        Log.Info("No Treasurer found.");
                    }
                }
                return this.exists;
            };
            Treasurer.prototype.GiveReadRight = function (usersWithRight) {
                if (usersWithRight === void 0) { usersWithRight = null; }
                if (this.Exists()) {
                    Log.Info("Grant read right to treasurer: " + this.login);
                    Process.SetRight(this.login, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(this.login) === -1) {
                        usersWithRight.push(this.login);
                    }
                }
            };
            Treasurer.prototype.StoreSomeInfo = function () {
                if (this.Exists(true)) {
                    Log.Info("Store some information about Treasurer");
                    var userVars = this.user.GetVars();
                    Variable.SetValueAsString("TreasurerName__", userVars.GetValue_String("DisplayName", 0));
                }
            };
            return Treasurer;
        }());
        Purchasing.Treasurer = Treasurer;
        function GetTreasurer() {
            return new Treasurer();
        }
        Purchasing.GetTreasurer = GetTreasurer;
        var APClerk = /** @class */ (function () {
            function APClerk() {
                this.login = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("PAC").GetParameter("APClerkLogin"));
                this.user = null;
                this.exists = null;
            }
            APClerk.prototype.Exists = function (needUser) {
                if (this.exists === null || (needUser && this.user === null)) {
                    if (!Variable.GetValueAsString("APClerkExists__") || needUser) {
                        this.user = g.Users.GetUser(this.login);
                        this.exists = this.user !== null;
                        Variable.SetValueAsString("APClerkExists__", this.exists ? "true" : "false");
                    }
                    else {
                        this.exists = Variable.GetValueAsString("APClerkExists__") === "true";
                    }
                    if (!this.exists) {
                        Log.Info("No AP Clerk found.");
                    }
                }
                return this.exists;
            };
            APClerk.prototype.GiveReadRight = function (usersWithRight) {
                if (usersWithRight === void 0) { usersWithRight = null; }
                if (this.Exists()) {
                    Log.Info("Grant read right to AP Clerk: " + this.login);
                    Process.SetRight(this.login, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(this.login) === -1) {
                        usersWithRight.push(this.login);
                    }
                }
            };
            APClerk.prototype.StoreSomeInfo = function () {
                if (this.Exists(true)) {
                    Log.Info("Store some information about AP Clerk");
                    var userVars = this.user.GetVars();
                    Variable.SetValueAsString("APClerkName__", userVars.GetValue_String("DisplayName", 0));
                }
            };
            return APClerk;
        }());
        Purchasing.APClerk = APClerk;
        function GetAPClerk() {
            return new APClerk();
        }
        Purchasing.GetAPClerk = GetAPClerk;
        function IsImgInRessources(imageLink) {
            var isURLexpression = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*))/g;
            var isURLregex = new RegExp(isURLexpression);
            return !(imageLink && imageLink.match(isURLregex));
        }
        function GetCatalogImageUrl(imageLink) {
            if (IsImgInRessources(imageLink)) {
                imageLink = Process.GetImageURL(imageLink);
            }
            return imageLink;
        }
        Purchasing.GetCatalogImageUrl = GetCatalogImageUrl;
        function HashLoginID(loginID) {
            var hash = 0, i, chr;
            if (loginID.length === 0) {
                return hash;
            }
            for (i = 0; i < loginID.length; i++) {
                chr = loginID.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
        Purchasing.HashLoginID = HashLoginID;
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
