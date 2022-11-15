///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Shipping management",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Object",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_P2P_UserProperties_V12.0.461.0",
    "Lib_Shipping_Workflow_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "[Lib_Shipping_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Carrier = /** @class */ (function () {
            function Carrier(_a) {
                var link = _a.link;
                this._link = link;
            }
            Carrier.prototype.GetLink = function (parcelNumber) {
                return this._link.replace("<parcelNumber>", parcelNumber);
            };
            return Carrier;
        }());
        var Carriers = /** @class */ (function () {
            function Carriers() {
            }
            Object.defineProperty(Carriers, "All", {
                /**
                 * Returns all carriers
                 */
                get: function () {
                    Carriers.LoadCarriers();
                    return Carriers.carriers;
                },
                enumerable: false,
                configurable: true
            });
            /**
             * Reset carrier list so they're loaded again at next access
             */
            Carriers.Reset = function () {
                Carriers.carriers = null;
            };
            /**
             * Load standard carriers and customized ones if not already done
             */
            Carriers.LoadCarriers = function () {
                var _a;
                if (Carriers.carriers === null) {
                    // load custom carriers
                    var updatedCustomCarriers = Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Common.UpdateCarriers", Carriers.standardCarriers);
                    if (updatedCustomCarriers) {
                        Carriers.standardCarriers = updatedCustomCarriers;
                    }
                    Carriers.carriers = {};
                    // Load default carriers
                    for (var name in Carriers.standardCarriers) {
                        if ((_a = Carriers.standardCarriers[name]) === null || _a === void 0 ? void 0 : _a.link) {
                            Carriers.carriers[name] = new Carrier({ link: Carriers.standardCarriers[name].link });
                        }
                        else {
                            Carriers.carriers[name] = new Carrier({ link: "" });
                        }
                    }
                }
            };
            Carriers.carriers = null;
            Carriers.standardCarriers = {
                "Chronopost": { link: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=<parcelNumber>" },
                "Colissimo": { link: "https://www.laposte.fr/outils/suivre-vos-envois?code=<parcelNumber>" },
                "DHL": { link: "https://www.dhl.com/fr-en/home/tracking.html?tracking-id=<parcelNumber>" },
                "DPD": { link: "https://www.dpd.fr/trace/<parcelNumber>" },
                "FedEx": { link: "https://www.fedex.com/fedextrack/?trknbr=<parcelNumber>" },
                "UPS": { link: "https://www.ups.com/track?tracknum=<parcelNumber>" },
                "USPS": { link: "https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=3&text28777=&tLabels=<parcelNumber>" }
            };
            return Carriers;
        }());
        Shipping.Carriers = Carriers;
        /**
         * Returns true if the current contributor has the specified role
         * @param role Workflow role to check
         * @returns true if the current contributor has the specified role
         */
        function IsCurrentStepRole(role) {
            var currentContributor = Lib.Shipping.Workflow.controller.GetCurrentContributor();
            return !!currentContributor && currentContributor.role === role;
        }
        Shipping.IsCurrentStepRole = IsCurrentStepRole;
        function IsCurrentContributor() {
            var currentContributor = Lib.Shipping.Workflow.controller.GetCurrentContributor();
            if (!currentContributor) {
                return false;
            }
            return Lib.P2P.CurrentUserMatchesLogin(currentContributor.login);
        }
        Shipping.IsCurrentContributor = IsCurrentContributor;
        function GetRecipients() {
            var allRecipientLogins = [];
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                var recipentLogin = Sys.Helpers.String.ExtractLoginFromDN(line.GetValue("ItemPORecipientDN__"));
                if (recipentLogin) {
                    allRecipientLogins.push(recipentLogin);
                }
            });
            return Sys.Helpers.Array.GetDistinctArray(allRecipientLogins);
        }
        Shipping.GetRecipients = GetRecipients;
        /**
         * @returns true if any missing fields detected
         */
        function CheckMandatoryFields(item) {
            if (item === void 0) { item = null; }
            var fieldNames = ["ItemPONumber__", "ItemPOLineNumber__"];
            var containsMissingField = false;
            Sys.Helpers.Array.ForEach(fieldNames, function (fieldName) {
                var isValueEmpty = item ? Sys.Helpers.IsEmpty(item.GetValue(fieldName)) : Sys.Helpers.IsEmpty(Data.GetValue(fieldName));
                if (isValueEmpty) {
                    containsMissingField = true;
                    if (item) {
                        item.SetError(fieldName, "This field is required!");
                    }
                    else {
                        Data.SetError(fieldName, "This field is required!");
                    }
                }
            });
            if (item) {
                CheckLinesCoherency(item);
            }
            return containsMissingField;
        }
        function CheckLinesCoherency(item) {
            var table = Data.GetTable("LineItems__");
            // Compare company code to first item of document table
            var error = table.GetItemCount() > 0 && item.GetValue("ItemCompanyCode__") !== table.GetItem(0).GetValue("ItemCompanyCode__");
            // PAC - PAC3 - FT-024365 Don't allow the creation of ASN on a mutli ship to order from the vendor portal
            item.SetError("ItemCompanyCode__", error ? "_Only items from the same company can be selected." : "");
            return error;
        }
        Shipping.CheckLinesCoherency = CheckLinesCoherency;
        function CheckAllLinesCoherency() {
            var error = false;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                //check error after CheckLinesCoherency(line) in the condition to don't stop verification after first line with error
                error = CheckLinesCoherency(line) || error;
            });
            return error;
        }
        Shipping.CheckAllLinesCoherency = CheckAllLinesCoherency;
        function QueryPOItems(orderNumber) {
            var additionnalFilters = [
                Sys.Helpers.LdapUtil.FilterEqual("ItemType__", Lib.P2P.ItemType.QUANTITY_BASED),
                Sys.Helpers.LdapUtil.FilterNotEqual("Status__", "Draft")
            ];
            return Lib.Purchasing.POItems.QueryPOItems({ orderNumber: orderNumber, additionnalFilters: additionnalFilters });
        }
        function FindMatchingPOItem(formItem, POItems) {
            Log.Info("[Shipping.FindMatchingPOItem] for PO ".concat(formItem.GetValue("ItemPONumber__"), " / Line number ").concat(formItem.GetValue("ItemPOLineNumber__")));
            var bestMatch = Sys.Helpers.Array.Reduce(POItems, function (bestMatchingPOItem, POItem) {
                var matchingScore = GetMatchingScore(POItem, formItem);
                var isMatchingScoreBetter = !(bestMatchingPOItem === null || bestMatchingPOItem === void 0 ? void 0 : bestMatchingPOItem.matchingScore) || bestMatchingPOItem.matchingScore < matchingScore;
                return matchingScore !== 0 && isMatchingScoreBetter ? { POItem: POItem, matchingScore: matchingScore } : bestMatchingPOItem;
            }, null);
            if (bestMatch) {
                Log.Verbose("[Shipping.FindMatchingPOItem] Match found with score ".concat(bestMatch.matchingScore));
            }
            else {
                Log.Info("[Shipping.FindMatchingPOItem] No match found");
            }
            return bestMatch === null || bestMatch === void 0 ? void 0 : bestMatch.POItem;
        }
        function GetMatchingScore(POItem, formItem) {
            Log.Verbose("[Shipping.GetMatchingScore]");
            var matchingScore = 0, matchingFieldsNumber = 0;
            var minMatchingFields = 2;
            var matchingFieldsMapping = [
                {
                    "POItemFieldName": "PONumber__",
                    "FormFieldName": "ItemPONumber__",
                    "isMandatory": true
                },
                {
                    "POItemFieldName": "LineNumber__",
                    "FormFieldName": "ItemPOLineNumber__",
                    "priority": 2
                }
            ];
            var isMandatoryFieldNotMatching = false;
            var isMatchingField;
            Sys.Helpers.Array.ForEach(matchingFieldsMapping, function (matchingFieldMapping) {
                isMatchingField = POItem.GetValue(matchingFieldMapping.POItemFieldName) == formItem.GetValue(matchingFieldMapping.FormFieldName);
                if (matchingFieldMapping.isMandatory) {
                    isMandatoryFieldNotMatching = isMandatoryFieldNotMatching && !isMatchingField;
                    if (!isMatchingField) {
                        Log.Verbose("[Shipping.GetMatchingScore] Mandatory field ".concat(matchingFieldMapping.FormFieldName, " : ").concat(formItem.GetValue(matchingFieldMapping.FormFieldName), " is not matching POItem field ").concat(matchingFieldMapping.POItemFieldName, " : ").concat(POItem.GetValue(matchingFieldMapping.POItemFieldName)));
                    }
                }
                if (isMatchingField) {
                    matchingFieldsNumber++;
                    matchingScore += matchingFieldMapping.priority || 1;
                }
            });
            var finalScore = matchingFieldsNumber >= minMatchingFields && !isMandatoryFieldNotMatching ? matchingScore : 0;
            Log.Verbose("[Shipping.GetMatchingScore] Final score ".concat(finalScore));
            return finalScore;
        }
        function CompleteItemFromPOItem(formItem, POItem) {
            Log.Info("[Shipping.CompleteItemFromPOItem]");
            Sys.Helpers.Object.ForEach(Lib.Purchasing.Items.POItemsToASN.mappings.byLine, function (formField, POItemField) {
                var formItemValue = formItem.GetValue(formField);
                var poItemValue = POItem.GetValue(POItemField);
                if (Sys.Helpers.IsEmpty(formItemValue) || formItemValue != poItemValue) {
                    formItem.SetValue(formField, poItemValue);
                    formItem.SetComputed(formField, false); // let autolearning take into account the value coming from browse
                }
            });
            CheckLinesCoherency(formItem);
        }
        function CompleteAndCheckItemsFromPOItems(formItems, POItems) {
            Log.Info("[Shipping.CompleteAndCheckItemsFromPOItems]");
            if ((formItems === null || formItems === void 0 ? void 0 : formItems.length) === 0) {
                Log.Info("[Shipping.CompleteAndCheckItemsFromPOItems] Should not happen");
                return;
            }
            var matchingPOItem;
            var lineNumber;
            var table = Data.GetTable("LineItems__");
            Sys.Helpers.Array.ForEach(formItems, function (formItem) {
                matchingPOItem = FindMatchingPOItem(formItem, POItems);
                if (matchingPOItem) {
                    lineNumber = formItem.GetValue("ItemPOLineNumber__");
                    Log.Verbose("[Shipping.CompleteAndCheckItemsFromPOItems] Item found for line ".concat(lineNumber));
                    CompleteItemFromPOItem(formItem, matchingPOItem);
                    if (matchingPOItem.GetValue("Status__") === "Received") {
                        Log.Info("[Shipping.CompleteAndCheckItemsFromPOItems] Item for line ".concat(lineNumber, " already received"));
                        formItem.SetError("ItemPOLineNumber__", "_ItemAlreadyReceived");
                    }
                    if (matchingPOItem.GetValue("Status__") === "Canceled" || matchingPOItem.GetValue("Status__") === "Rejected") {
                        Log.Info("[Shipping.CompleteAndCheckItemsFromPOItems] Item for line ".concat(lineNumber, " canceled"));
                        formItem.SetError("ItemPOLineNumber__", "_ItemCanceled");
                    }
                    // Once we have filled the items (with CompleteItemFromPOItem), we check company code with first line
                    // (or first item of the formItems parameter if table has not been filled yet but should not happen)
                    var firstItemCompanyCode = table.GetItemCount() > 0 ? table.GetItem(0).GetValue("ItemCompanyCode__") : formItems[0].GetValue("ItemCompanyCode__");
                    if (matchingPOItem.GetValue("CompanyCode__") !== firstItemCompanyCode) {
                        // PAC - PAC3 - FT-024365 Don't allow the creation of ASN on a mutli ship to order from the vendor portal
                        formItem.SetError("ItemCompanyCode__", "_Only items from the same company can be selected.");
                    }
                }
                else if (!CheckMandatoryFields(formItem)) {
                    Log.Info("[Shipping.CompleteAndCheckItemsFromPOItems] Item not found for line ".concat(lineNumber));
                    formItem.SetError("ItemPOLineNumber__", "_ItemNotFound");
                }
            });
        }
        function CompleteItemsWithOrderData() {
            Log.Info("[Shipping.CompleteItemsWithOrderData]");
            var orderNumbers = Lib.Shipping.GetOrderNumbers();
            var promises = [];
            var items;
            Sys.Helpers.Object.ForEach(orderNumbers, function (PONumber) {
                items = Lib.Shipping.GetPOItemsForPO(PONumber);
                promises.push(CompleteItemsFromOrderNumber(PONumber, items));
            });
            return Sys.Helpers.Promise.All(promises).Then(function (results) {
                return Sys.Helpers.Array.Reduce(results, function (acc, result) { return acc.concat(result); }, []);
            });
        }
        function ResetWarnings(formItem) {
            var fieldsToReset = ["ItemPONumber__", "ItemDescription__", "ItemPOLineQuantity__", "ItemUOM__", "ItemPORecipientDN__", "ItemCompanyCode__"];
            Sys.Helpers.Array.ForEach(fieldsToReset, function (fieldName) {
                formItem.SetWarning(fieldName, "");
            });
        }
        function CompleteFormItem(formItem, POItem) {
            ResetWarnings(formItem);
            Log.Info("[Shipping.CompleteFormItem]");
            var returnPromise;
            if (POItem) {
                Log.Verbose("[Shipping.CompleteFormItem] Completing form item with POItem");
                CompleteItemFromPOItem(formItem, POItem);
                returnPromise = Sys.Helpers.Promise.Resolve([POItem]);
            }
            else {
                Log.Verbose("[Shipping.CompleteFormItem] No POitem given -> querying POItem before completing item");
                var PONumber = formItem.GetValue("ItemPONumber__");
                if (PONumber) {
                    var formItems = [formItem];
                    returnPromise = CompleteItemsFromOrderNumber(PONumber, formItems);
                }
                else {
                    Log.Verbose("[Shipping.CompleteFormItem] No POitem given -> ItemPONumber__ not set");
                    returnPromise = Sys.Helpers.Promise.Resolve([]);
                }
            }
            return returnPromise;
        }
        Shipping.CompleteFormItem = CompleteFormItem;
        function CompleteItemsFromOrderNumber(PONumber, formItems) {
            return QueryPOItems(PONumber).Then(function (POItems) {
                Log.Verbose("[Shipping.CompleteItemsFromOrderNumber] Order ".concat(PONumber, " found"));
                CompleteAndCheckItemsFromPOItems(formItems, POItems);
                return POItems;
            })
                .Catch(function () {
                Log.Info("[Shipping.CompleteItemsFromOrderNumber] Order ".concat(PONumber, " not found"));
                Sys.Helpers.Array.ForEach(formItems, function (formItem) {
                    formItem.SetError("ItemPONumber__", "_PurchaseOrderNotFound");
                });
                return [];
            });
        }
        var StatusLabels;
        (function (StatusLabels) {
            StatusLabels["Draft"] = "_ASN Draft";
            StatusLabels["Submitted"] = "_ASN Submitted";
            StatusLabels["PartiallyReceived"] = "_ASN Partially Received";
            StatusLabels["Received"] = "_ASN Received";
            StatusLabels["Rejected"] = "_ASN Rejected";
        })(StatusLabels = Shipping.StatusLabels || (Shipping.StatusLabels = {}));
        function GetCarrierLink(name, parcelNumber) {
            if (name in Carriers.All) {
                return Carriers.All[name].GetLink(parcelNumber);
            }
            return "";
        }
        Shipping.GetCarrierLink = GetCarrierLink;
        function GetCarrierNames() {
            return Object.keys(Carriers.All);
        }
        Shipping.GetCarrierNames = GetCarrierNames;
        function IsPartiallyReceived() {
            var isPartiallyReceived = false;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                if (item.GetValue("ItemQuantity__") > item.GetValue("ItemQuantityReceived__")) {
                    isPartiallyReceived = true;
                }
            });
            return isPartiallyReceived;
        }
        Shipping.IsPartiallyReceived = IsPartiallyReceived;
        function IsPartiallyReceivedForUser(currentUser) {
            var isPartiallyReceived = false;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                if (item.GetValue("ItemQuantity__") > item.GetValue("ItemQuantityReceived__")) {
                    var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(item.GetValue("ItemPORecipientDN__"));
                    if (Lib.P2P.CurrentUserMatchesLogin(recipientLogin, currentUser)) {
                        isPartiallyReceived = true;
                    }
                }
            });
            return isPartiallyReceived;
        }
        Shipping.IsPartiallyReceivedForUser = IsPartiallyReceivedForUser;
        function GetOrderNumbers() {
            var orderNumbers = [];
            var lineOrderNumber;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                lineOrderNumber = line.GetValue("ItemPONumber__");
                if (Sys.Helpers.Array.IndexOf(orderNumbers, lineOrderNumber) === -1) {
                    orderNumbers.push(lineOrderNumber);
                }
            });
            return orderNumbers;
        }
        Shipping.GetOrderNumbers = GetOrderNumbers;
        function GetPOItemsForPO(PONumber, currentUser) {
            var items = [];
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                if (currentUser) {
                    if (PONumber === line.GetValue("ItemPONumber__") && Lib.P2P.CurrentUserMatchesLogin(Sys.Helpers.String.ExtractLoginFromDN(line.GetValue("ItemPORecipientDN__")), currentUser)) {
                        items.push(line);
                    }
                }
                else if (PONumber === line.GetValue("ItemPONumber__")) {
                    items.push(line);
                }
            });
            return items;
        }
        Shipping.GetPOItemsForPO = GetPOItemsForPO;
        function CompleteHeaderWithOrderData(allPOItems) {
            Log.Info("[Shipping.CompleteHeaderWithOrderData]");
            return Sys.Helpers.Promise.Resolve()
                .Then(function () {
                var asyncTaskPromise = Sys.Helpers.Promise.Resolve();
                if (!(allPOItems === null || allPOItems === void 0 ? void 0 : allPOItems.length)) {
                    Log.Info("[Shipping.CompleteHeaderWithOrderData] cannot complete header : no POItem returned");
                    return asyncTaskPromise;
                }
                var firstPOItem = allPOItems[0];
                Sys.TechnicalData.SetValue("ShipToCompany", firstPOItem.GetValue("ShipToCompany__"));
                var firstLineAddress = firstPOItem.GetValue("ShipToAddress__");
                if (firstLineAddress) {
                    Data.SetValue("ShipToAddress__", firstLineAddress);
                }
                var companyCode = firstPOItem.GetValue("CompanyCode__");
                if (companyCode) {
                    Data.SetValue("CompanyCode__", companyCode);
                    Lib.Shipping.LoadCompanyCodeConfiguration(companyCode);
                }
                var vendorName = firstPOItem.GetValue("VendorName__");
                if (vendorName) {
                    var setVendor = Data.GetValue("VendorName__") !== vendorName;
                    if (setVendor || Sys.Helpers.IsEmpty(Data.GetValue("VendorAddress__"))) {
                        // do not overwrite correctly extracted vendor name in order to taken into account by the auto-learning
                        if (setVendor) {
                            Data.SetValue("VendorName__", vendorName);
                        }
                        asyncTaskPromise = asyncTaskPromise
                            .Then(function () { return Lib.Shipping.ComputeVendorAddress(companyCode, firstPOItem.GetValue("VendorNumber__")); })
                            .Then(function (vendorAddress) {
                            Data.SetValue("VendorAddress__", vendorAddress);
                        });
                    }
                }
                if (companyCode) {
                    asyncTaskPromise = asyncTaskPromise
                        .Then(function () { return Lib.Shipping.LoadCompanyCodeConfiguration(companyCode); });
                }
                return asyncTaskPromise;
            });
        }
        Shipping.CompleteHeaderWithOrderData = CompleteHeaderWithOrderData;
        function CheckMandatoryFieldsForFillingForm() {
            Log.Info("[Shipping.CheckMandatoryFieldsForFillingForm]");
            if (Data.GetTable("LineItems__").GetItemCount() === 0) {
                Log.Info("[Shipping.CheckMandatoryFieldsForFillingForm] No item in form");
                return false;
            }
            var containsMissingField = false;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                containsMissingField = CheckMandatoryFields(item);
                return containsMissingField; // break loop
            });
            if (containsMissingField) {
                Log.Info("[Shipping.CheckMandatoryFieldsForFillingForm] Mandatory fields are not filled correctly");
            }
            return !containsMissingField;
        }
        Shipping.CheckMandatoryFieldsForFillingForm = CheckMandatoryFieldsForFillingForm;
        function CompleteFormWithOrderData() {
            Log.Info("[Shipping.CompleteFormWithOrderData]");
            return CompleteItemsWithOrderData().Then(Lib.Shipping.CompleteHeaderWithOrderData);
        }
        Shipping.CompleteFormWithOrderData = CompleteFormWithOrderData;
        function TryToCompleteFormWithOrderData() {
            Log.Info("[Shipping.TryToCompleteFormWithOrderData]");
            return Sys.Helpers.Promise.Resolve()
                .Then(function () {
                var mandatoryFieldsAreCompleted = Lib.Shipping.CheckMandatoryFieldsForFillingForm();
                return Lib.Shipping.CompleteFormWithOrderData().Then(function () { return mandatoryFieldsAreCompleted; });
            })
                .Catch(function (reason) {
                if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                    Log.Error("[Shipping.TryToCompleteFormWithOrderData] unexpected error: ".concat(reason));
                }
                return false;
            });
        }
        Shipping.TryToCompleteFormWithOrderData = TryToCompleteFormWithOrderData;
        function ComputeVendorAddress(companyCode, vendorNumber) {
            Log.Info("[Shipping.ComputeVendorAddress] with companyCode: ".concat(companyCode, ", vendorNumber: ").concat(vendorNumber));
            var queryOptions = {
                table: "AP - Vendors__",
                filter: "(&(Number__=".concat(vendorNumber, ")(|(CompanyCode__=").concat(companyCode, ")(CompanyCode__=)(CompanyCode__!=*)))"),
                attributes: ["Name__", "Sub__", "Street__", "PostOfficeBox__", "City__", "PostalCode__", "Region__", "Country__"],
                maxRecords: 1,
                additionalOptions: {
                    asAdmin: true
                }
            };
            var vendor = null;
            return Sys.GenericAPI.PromisedQuery(queryOptions)
                .Then(function (records) {
                if (records.length === 0) {
                    Log.Error("[Shipping.ComputeVendorAddress] vendor not found");
                    throw new Sys.Helpers.Promise.HandledError();
                }
                vendor = records[0];
                var options = {
                    isVariablesAddress: true,
                    address: {
                        ToName: vendor.Name__,
                        ToSub: vendor.Sub__,
                        ToMail: vendor.Street__,
                        ToPostal: vendor.PostalCode__,
                        ToCountry: vendor.Country__,
                        ToCountryCode: vendor.Country__,
                        ToState: vendor.Region__,
                        ToCity: vendor.City__,
                        ToPOBox: vendor.PostOfficeBox__,
                        ForceCountry: false // TODO set this flag according to the ShipToCountry
                    },
                    countryCode: vendor.Country__
                };
                return Sys.GenericAPI.PromisedCheckPostalAddress(options);
            })
                .Then(function (address) {
                if (address.LastErrorMessage) {
                    Log.Warn("[Shipping.ComputeVendorAddress] Invalid postal address: ".concat(address.LastErrorMessage));
                    return "".concat(vendor.Name__, "\n").concat(vendor.Street__, "\n").concat(vendor.City__, "\n").concat(vendor.PostalCode__, "\n").concat(vendor.Country__);
                }
                var fmtAddress = address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, ""); // removes first line
                if (vendor.Name__) {
                    fmtAddress = [vendor.Name__, fmtAddress].join("\n");
                }
                return fmtAddress;
            })
                .Catch(Sys.Helpers.Promise.HandledError.Catcher("Shipping.ComputeVendorAddress"));
        }
        Shipping.ComputeVendorAddress = ComputeVendorAddress;
        function InitDefaultCompanyCode() {
            if (Sys.Helpers.IsEmpty(Data.GetValue("CompanyCode__"))) {
                // First: look for company code in first line item
                var table = Data.GetTable("LineItems__");
                if (table.GetItemCount() > 0 && !Sys.Helpers.IsEmpty(table.GetItem(0).GetValue("ItemCompanyCode__"))) {
                    var companyCode = table.GetItem(0).GetValue("ItemCompanyCode__");
                    Data.SetValue("CompanyCode__", companyCode);
                    Log.Verbose("[Shipping.InitDefaultCompanyCode] companyCode found in first row: ".concat(companyCode));
                    return Lib.Shipping.LoadCompanyCodeConfiguration(companyCode);
                }
                // Else, use default company code of user
                var userLogin = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.loginId : Lib.Purchasing.GetValidatorOrOwner().GetValue("Login");
                Log.Info("[Shipping.InitDefaultCompanyCode] with userLogin: ".concat(userLogin));
                return Lib.P2P.UserProperties.QueryValues(userLogin)
                    .Then(function (userProps) {
                    var companyCode = userProps.CompanyCode__ || "";
                    Data.SetValue("CompanyCode__", companyCode);
                    Log.Verbose("[Shipping.InitDefaultCompanyCode] companyCode found: ".concat(companyCode));
                    return Lib.Shipping.LoadCompanyCodeConfiguration(companyCode);
                })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("Shipping.InitDefaultCompanyCode"));
            }
            return Sys.Helpers.Promise.Resolve();
        }
        Shipping.InitDefaultCompanyCode = InitDefaultCompanyCode;
        function LoadCompanyCodeConfiguration(companyCode) {
            Log.Info("[Shipping.LoadCompanyCodeConfiguration] with companyCode: ".concat(companyCode));
            return Sys.Helpers.Promise.Resolve()
                .Then(function () {
                if (companyCode) {
                    return Lib.P2P.CompanyCodesValue.QueryValues(companyCode, false, { asAdmin: true })
                        .Then(function (CCValues) { return CCValues.DefaultConfiguration__ || "default"; })
                        .Catch(function (reason) {
                        Log.Warn("[Shipping.LoadCompanyCodeConfiguration] an error occured while requesting company code values. Details: " + reason);
                        return "default";
                    });
                }
                Log.Info("[Shipping.LoadCompanyCodeConfiguration] no company code => configuration 'default'");
                return "default";
            })
                .Then(function (configName) {
                Log.Info("[Shipping.LoadCompanyCodeConfiguration] reload PAC configuration with name: ".concat(configName));
                return Lib.P2P.ChangeConfiguration(configName);
            })
                .Catch(Sys.Helpers.Promise.HandledError.Catcher("Shipping.LoadCompanyCodeConfiguration"));
        }
        Shipping.LoadCompanyCodeConfiguration = LoadCompanyCodeConfiguration;
        function GetShippedQuantity(PONumber, lineNumber) {
            Log.Verbose("[Shipping.GetShippedQuantity] PO/line:".concat(PONumber, "/").concat(lineNumber));
            var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Line_ItemPONumber__", PONumber), Sys.Helpers.LdapUtil.FilterEqual("Line_ItemPOLineNumber__", lineNumber), Sys.Helpers.LdapUtil.FilterNotExist("Line_ItemQuantityReceived__"), Sys.Helpers.LdapUtil.FilterEqual("Status__", "Submitted")).toString();
            var table = "CDLNAME#Advanced Shipping Notice Vendor.LineItems__";
            var ASNQueryOptions = {
                table: table,
                filter: filter,
                attributes: [
                    "Line_ItemQuantity__"
                ]
            };
            return Sys.GenericAPI.PromisedQuery(ASNQueryOptions)
                .Then(function (queryResults) {
                var shippedQuantity = Sys.Helpers.Array.Reduce(queryResults, function (s, c) {
                    return s.add(c.Line_ItemQuantity__ || 0);
                }, new Sys.Decimal(0));
                Log.Info("[Shipping.GetShippedQuantity] PO/line:".concat(PONumber, "/").concat(lineNumber, " -> ").concat(shippedQuantity.toNumber()));
                return shippedQuantity;
            });
        }
        Shipping.GetShippedQuantity = GetShippedQuantity;
        function GetGRQuantities(PONumber, lineNumber) {
            Log.Verbose("[Shipping.GetReceivedQuantity] PO/line:".concat(PONumber, "/").concat(lineNumber));
            var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", PONumber), Sys.Helpers.LdapUtil.FilterEqual("LineNumber__", lineNumber), Sys.Helpers.LdapUtil.FilterNotEqual("Status__", "Canceled")).toString();
            var table = Lib.Purchasing.Items.GRItemsDBInfo.table;
            var ASNQueryOptions = {
                table: table,
                filter: filter,
                attributes: ["Quantity__", "ReturnedQuantity__"],
                additionalOptions: {
                    asAdmin: true
                }
            };
            return Sys.GenericAPI.PromisedQuery(ASNQueryOptions)
                .Then(function (queryResults) {
                var quantities = Sys.Helpers.Array.Reduce(queryResults, function (s, c) {
                    return { receivedQty: s.receivedQty.add(c.Quantity__ || 0), returnedQty: s.returnedQty.add(c.ReturnedQuantity__ || 0) };
                }, { receivedQty: new Sys.Decimal(0), returnedQty: new Sys.Decimal(0) });
                Log.Info("[Shipping.GetReceivedQuantity] PO/line:".concat(PONumber, "/").concat(lineNumber, " -> receivedQty: ").concat(quantities.receivedQty.toNumber(), ", returnedQty: ").concat(quantities.returnedQty.toNumber()));
                return quantities;
            });
        }
        Shipping.GetGRQuantities = GetGRQuantities;
        function GetRemainingQuantityToShip(ASNLineItem) {
            var PONumber = ASNLineItem.GetValue("ItemPONumber__");
            var lineNumber = ASNLineItem.GetValue("ItemPOLineNumber__");
            var orderedQuantity = new Sys.Decimal(ASNLineItem.GetValue("ItemPOLineQuantity__") || 0);
            Log.Verbose("[Shipping.GetRemainingQuantityToShip] PO/line:".concat(PONumber, "/").concat(lineNumber));
            var shippedQuantity = new Sys.Decimal(0);
            var receivedQuantity = new Sys.Decimal(0);
            var returnedQuantity = new Sys.Decimal(0);
            if (!PONumber || !lineNumber) {
                return Sys.Helpers.Promise.Reject();
            }
            var promise = Sys.Helpers.Promise.Resolve();
            promise = promise.Then(function () {
                Lib.Shipping.GetShippedQuantity(PONumber, lineNumber).Then(function (qty) {
                    shippedQuantity = qty;
                    Log.Verbose("[Shipping.GetRemainingQuantityToShip] shippedQuantity=".concat(shippedQuantity));
                });
            });
            promise = promise.Then(function () {
                Lib.Shipping.GetGRQuantities(PONumber, lineNumber).Then(function (qties) {
                    receivedQuantity = qties.receivedQty;
                    returnedQuantity = qties.returnedQty;
                    Log.Verbose("[Shipping.GetRemainingQuantityToShip] receivedQuantity=".concat(receivedQuantity));
                });
            });
            promise = promise.Then(function () {
                Log.Verbose("[Shipping.GetRemainingQuantityToShip] ".concat(orderedQuantity, " / ").concat(shippedQuantity, " / ").concat(receivedQuantity));
                var properties = ASNLineItem.GetProperties("ItemQuantityToShip__");
                var precision = properties.precision || 2;
                var quantityToship = Sys.Decimal.max(0, orderedQuantity.sub(shippedQuantity).sub(receivedQuantity).add(returnedQuantity)).toNumber();
                quantityToship = Sys.Helpers.Round(quantityToship, precision);
                Log.Info("[Shipping.GetRemainingQuantityToShip] PO/line:".concat(PONumber, "/").concat(lineNumber, " quantityToship -> ").concat(quantityToship));
                return quantityToship;
            });
            return promise;
        }
        Shipping.GetRemainingQuantityToShip = GetRemainingQuantityToShip;
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
