///#GLOBALS Sys
/// <reference path="Lib_AP_VendorPortal.ts" />
/* LIB_DEFINITION{
  "name": "LIB_AP_VendorPortal_CIData_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: Describe customer invoice structure",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_VIPData_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0",
    "LIB_AP_VendorPortal_V12.0.461.0",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_GenericAPI_Server"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var VendorPortal;
        (function (VendorPortal) {
            var FieldMapping = /** @class */ (function () {
                function FieldMapping(name, formatter) {
                    this.name = name;
                    this.formatter = formatter;
                }
                return FieldMapping;
            }());
            var headerMapping = {
                InvoiceNumber: new FieldMapping("Invoice_number__"),
                InvoiceDate: new FieldMapping("Invoice_date__", getDate),
                InvoiceAmount: new FieldMapping("Invoice_amount__"),
                NetAmount: new FieldMapping("Net_amount__"),
                TaxAmount: new FieldMapping("Tax_amount__"),
                InvoiceCurrency: new FieldMapping("Currency__"),
                DueDate: new FieldMapping("Due_date__", getDate),
                OrderNumber: new FieldMapping("Order_number__"),
                OrderDate: new FieldMapping("OrderDate__", getDate),
                InvoiceStatus: new FieldMapping("CustomerInvoiceStatus__"),
                PaymentTerms: new FieldMapping("PaymentTerms__"),
                SpecificMentions: new FieldMapping("SpecificMentions__"),
                ReceptionMethod: new FieldMapping("ReceptionMethod__"),
                ContractNumber: new FieldMapping("ContractNumber__")
            };
            VendorPortal.lineItemMapping = {
                ItemNumber: "ItemNumber__",
                Description: "Description__",
                Amount: "ExpectedAmount__",
                Quantity: "ExpectedQuantity__",
                Unit: "UnitOfMeasureCode__",
                UnitPrice: "UnitPrice__",
                PartNumber: "PartNumber__",
                TaxCode: "TaxCode__",
                TaxRate: "TaxRate__",
                NonDeductibleTaxRate: "NonDeductibleTaxRate__",
                SESIdentifier: "SESIdentifier__"
            };
            var CIData = /** @class */ (function () {
                function CIData() {
                    this.BillTo__ = new CustomerInvoiceContact();
                    this.Vendor__ = new CustomerInvoiceContact();
                }
                CIData.prototype.toVIPData = function (overrideValues) {
                    var vipData = new AP.VIPData();
                    vipData.tables.TaxInformations.push(new AP.VIPTaxInformation());
                    vipData.tables.PaymentInformations.push(new AP.VIPPaymentInformations());
                    // Fill header fields
                    Sys.Helpers.Object.ForEach(headerMapping, 
                    /**
                     * @this CIData
                     */
                    function (ciField, vipField) {
                        var val = "";
                        if (overrideValues && overrideValues[ciField.name]) {
                            val = overrideValues[ciField.name];
                        }
                        else if (this[ciField.name] || this[ciField.name] === 0) {
                            val = this[ciField.name];
                        }
                        if (ciField.formatter) {
                            val = ciField.formatter(val);
                        }
                        vipData.header[vipField] = val;
                    }, this);
                    // Fill line fields
                    var lineItems = this.LineItems__;
                    if (!lineItems || lineItems.length === 0) {
                        lineItems = new Array(new CIItemData());
                    }
                    vipData.tables.LineItems = lineItems.map(function (lineItem, index) {
                        var overrideLine;
                        // eslint-disable-next-line dot-notation
                        if (overrideValues && overrideValues["LineItems__"] && overrideValues["LineItems__"][index]) {
                            // eslint-disable-next-line dot-notation
                            overrideLine = overrideValues["LineItems__"][index];
                        }
                        var vipLineItem = new AP.VIPLineItem();
                        Sys.Helpers.Object.ForEach(VendorPortal.lineItemMapping, function (ciField, vipField) {
                            if (overrideLine && (overrideLine[ciField] || overrideLine[ciField] === 0)) {
                                vipLineItem[vipField] = overrideLine[ciField];
                            }
                            else if (lineItem[ciField] || lineItem[ciField] === 0) {
                                vipLineItem[vipField] = lineItem[ciField];
                            }
                            else {
                                vipLineItem[vipField] = "";
                            }
                        });
                        vipLineItem.OrderNumber = this.Order_number__;
                        return vipLineItem;
                    }, this);
                    // Fill vendor
                    Sys.Helpers.Object.ForEach(this.Vendor__, function (value, field) {
                        vipData.header["Vendor" + field] = value;
                    });
                    vipData.header.VendorAddress = this.Vendor__.Address();
                    // Fill customer
                    Sys.Helpers.Object.ForEach(this.BillTo__, function (value, field) {
                        vipData.header["Customer" + field] = value;
                    });
                    vipData.header.CustomerAddress = this.BillTo__.Address();
                    return vipData;
                };
                /**
                 * Set the Tax_amount and Net_amount based on the CIItemData[]
                 */
                CIData.prototype.computeHeaderAmounts = function () {
                    var _this = this;
                    this.Net_amount__ = 0;
                    this.Tax_amount__ = 0;
                    this.LineItems__.forEach(function (item) {
                        _this.Net_amount__ += item.ExpectedAmount__;
                        _this.Tax_amount__ += item.TaxAmount__;
                    });
                    this.Invoice_amount__ = this.Net_amount__ + this.Tax_amount__;
                };
                return CIData;
            }());
            VendorPortal.CIData = CIData;
            var CIItemData = /** @class */ (function () {
                function CIItemData(poItemVars) {
                    this.ItemNumber__ = poItemVars ? poItemVars.GetValue_String("ItemNumber__", 0) : "";
                    this.PartNumber__ = poItemVars ? poItemVars.GetValue_String("PartNumber__", 0) : "";
                    this.UnitPrice__ = poItemVars ? poItemVars.GetValue_Double("UnitPrice__", 0) : 0;
                    this.UnitOfMeasureCode__ = poItemVars ? poItemVars.GetValue_String("UnitOfMeasureCode__", 0) : "";
                    var invoicedAmount = poItemVars ? poItemVars.GetValue_Double("InvoicedAmount__", 0) : 0;
                    this.ExpectedAmount__ = poItemVars ? poItemVars.GetValue_Double("DeliveredAmount__", 0) - invoicedAmount : 0;
                    this.OpenAmount__ = poItemVars ? poItemVars.GetValue_Double("OrderedAmount__", 0) - invoicedAmount : 0;
                    var invoicedQuantity = poItemVars ? poItemVars.GetValue_Double("InvoicedQuantity__", 0) : 0;
                    this.ExpectedQuantity__ = poItemVars ? poItemVars.GetValue_Double("DeliveredQuantity__", 0) - invoicedQuantity : 0;
                    this.OpenQuantity__ = poItemVars ? poItemVars.GetValue_Double("OrderedQuantity__", 0) - invoicedQuantity : 0;
                    this.TaxCode__ = poItemVars ? poItemVars.GetValue_String("TaxCode__", 0) : "";
                    this.TaxRate__ = poItemVars ? poItemVars.GetValue_Double("TaxRate__", 0) : 0;
                    this.NonDeductibleTaxRate__ = poItemVars ? poItemVars.GetValue_Double("NonDeductibleTaxRate__", 0) || 0 : 0;
                    this.Description__ = poItemVars ? poItemVars.GetValue_String("Description__", 0) : "";
                    //default value, change outside if coming from PO
                    this.isFromPO = false;
                }
                return CIItemData;
            }());
            VendorPortal.CIItemData = CIItemData;
            /**
             * ContactAddress class describe the basic informations for a contact
             * and also provide a unified stringify version of the address block
             */
            var CustomerInvoiceContact = /** @class */ (function () {
                function CustomerInvoiceContact() {
                }
                CustomerInvoiceContact.prototype.Address = function () {
                    var options = {
                        "isVariablesAddress": true,
                        "address": {
                            "ToName": this.Name,
                            "ToMail": this.Street,
                            "ToPostal": this.PostalCode,
                            "ToCountry": this.Country,
                            "ToCountryCode": this.Country,
                            "ToState": this.Region,
                            "ToCity": this.City,
                            "ToPOBox": this.PostOfficeBox,
                            "ForceCountry": true
                        },
                        "countryCode": this.Country
                    };
                    var address = Sys.GenericAPI.CheckPostalAddress(options);
                    if (address.LastErrorMessage) {
                        Log.Warn("Invalid postal address: ".concat(address.LastErrorMessage));
                        return "".concat(this.Name, "\n").concat(this.Street, "\n").concat(this.City, "\n").concat(this.PostalCode, "\n").concat(this.Country);
                    }
                    var result = address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, "");
                    if (this.Name) {
                        result = [this.Name, result].join("\n");
                    }
                    return result;
                };
                return CustomerInvoiceContact;
            }());
            VendorPortal.CustomerInvoiceContact = CustomerInvoiceContact;
            function createCIDataFromPO(companyCode, vendorNumber, orderNumber, additionnalData) {
                var ciData;
                /**
                 * Set the header values for the CIData
                 * @returns A partially completed CIData or null if no PO found
                 */
                function initWithHeaderInformations() {
                    // Retrieve PO
                    var resultCI = null;
                    Log.Info("Create new CIData - Fetching PO " + orderNumber);
                    var queryCallback = function (result, error) {
                        if (error) {
                            Log.Error("Create new CIData - First MoveNextRecord failed: " + error);
                        }
                        else if (result && result.length > 0) {
                            var record = result[0];
                            resultCI = new CIData();
                            resultCI.Order_number__ = orderNumber;
                            resultCI.VendorNumber__ = vendorNumber;
                            resultCI.CompanyCode__ = companyCode;
                            if (additionnalData && additionnalData.contractNumber) {
                                resultCI.ContractNumber__ = additionnalData.contractNumber;
                            }
                            var orderDateFromPO = Sys.Helpers.Date.ISOSTringToDate(record.OrderDate__);
                            if (orderDateFromPO) {
                                orderDateFromPO.setHours(13);
                            }
                            resultCI.OrderDate__ = orderDateFromPO;
                            resultCI.Invoice_date__ = new Date();
                            resultCI.Currency__ = getCurrency();
                            resultCI.CustomerInvoiceStatus__ = Lib.AP.CIStatus.Draft;
                        }
                    };
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber)).toString();
                    var attributes = ["OrderDate__"];
                    Sys.GenericAPI.Query(Lib.P2P.TableNames.POHeaders, filter, attributes, queryCallback, null, 1, { asAdmin: true });
                    return resultCI;
                }
                function getCurrency() {
                    var currency;
                    var companyInformations = getCompanyInformation();
                    if (companyInformations !== null) {
                        currency = companyInformations.GetVars().GetValue_String("Currency__", 0);
                    }
                    return currency;
                }
                function setBillToInformations() {
                    var companyInformations = getCompanyInformation();
                    if (companyInformations !== null) {
                        ciData.BillTo__.Name = companyInformations.GetVars().GetValue_String("CompanyName__", 0);
                        ciData.BillTo__.Sub = companyInformations.GetVars().GetValue_String("Sub__", 0);
                        ciData.BillTo__.Street = companyInformations.GetVars().GetValue_String("Street__", 0);
                        ciData.BillTo__.PostalCode = companyInformations.GetVars().GetValue_String("PostalCode__", 0);
                        ciData.BillTo__.City = companyInformations.GetVars().GetValue_String("City__", 0);
                        ciData.BillTo__.Country = companyInformations.GetVars().GetValue_String("Country__", 0);
                        ciData.BillTo__.Region = companyInformations.GetVars().GetValue_String("Region__", 0);
                        ciData.BillTo__.PostOfficeBox = companyInformations.GetVars().GetValue_String("PostOfficeBox__", 0);
                        ciData.BillTo__.VATNumber = companyInformations.GetVars().GetValue_String("VATNumber__", 0);
                        ciData.BillTo__.TaxCode = companyInformations.GetVars().GetValue_String("SIRET__", 0);
                    }
                }
                /**
                 * Get the PurchasingCompanycodes__ record associated with the scoped company code
                 * This function manage a basic cache to avoid too many queries
                 * @returns {(xRecord | null)} The xRecord for this companyCode or null if not found
                 */
                // TODO Add a decorator @Memoize to simplify the creation
                var getCompanyInformation = (function () {
                    var recordCache = {};
                    return function () {
                        if (!recordCache.PurchasingCompanycodes__) {
                            var query = Process.CreateQueryAsProcessAdmin();
                            query.SetSpecificTable("PurchasingCompanycodes__");
                            query.SetFilter(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode).toString());
                            if (query.MoveFirst()) {
                                recordCache.PurchasingCompanycodes__ = query.MoveNextRecord();
                            }
                        }
                        return recordCache.PurchasingCompanycodes__;
                    };
                })();
                function getNextItemNumber(itemNumber) {
                    if (!itemNumber) {
                        if (ciData && ciData.LineItems__.length > 0) {
                            itemNumber = ciData.LineItems__[ciData.LineItems__.length - 1].ItemNumber__;
                        }
                        else {
                            itemNumber = "0";
                        }
                    }
                    return (parseInt(itemNumber, 10) + 10).toString();
                }
                function setSESLineItems() {
                    if (additionnalData && additionnalData.customerOrderIdentifier) {
                        if (!ciData.LineItems__) {
                            ciData.LineItems__ = new Array();
                        }
                        var processQuery = Process.CreateQuery();
                        processQuery.SetSpecificTable("CDNAME#Service Entry Sheet");
                        processQuery.SetFilter("&(State=100)(ParentCustomerOrder__=" + additionnalData.customerOrderIdentifier + ")");
                        processQuery.SetSearchInArchive(true);
                        processQuery.SetAttributesList("DataFile,RUIDEX,ParentCustomerOrder__,State");
                        if (processQuery.MoveFirst()) {
                            var transport = processQuery.MoveNext();
                            while (transport) {
                                var processVars = transport.GetUninheritedVars();
                                var currentRUIDEx = processVars.GetValue_String("RUIDEX", 0);
                                var formData = transport.GetFormData();
                                var tableName = formData.GetTable("LineServices__");
                                for (var lineIdx = 0; lineIdx < tableName.GetItemCount(); lineIdx++) {
                                    var line = tableName.GetItem(lineIdx);
                                    var item = new CIItemData();
                                    item.SESIdentifier__ = currentRUIDEx;
                                    item.Description__ = line.GetValue("ItemDescription__");
                                    item.ExpectedQuantity__ = parseFloat(line.GetValue("Quantity__"));
                                    item.OpenQuantity__ = parseFloat(line.GetValue("Quantity__"));
                                    item.UnitPrice__ = parseFloat(line.GetValue("ItemUnitPrice__"));
                                    item.ExpectedAmount__ = parseFloat(line.GetValue("Quantity__")) * item.UnitPrice__;
                                    item.OpenAmount__ = item.ExpectedAmount__;
                                    item.UnitOfMeasureCode__ = line.GetValue("UnitOfMeasure__");
                                    item.TaxRate__ = 0;
                                    item.TaxAmount__ = 0;
                                    item.NonDeductibleTaxRate__ = 0;
                                    var shouldBeAdded = isSESLineToAdd(item, ciData.LineItems__);
                                    if (shouldBeAdded) {
                                        item.ItemNumber__ = getNextItemNumber();
                                        ciData.LineItems__.push(item);
                                    }
                                }
                                transport = processQuery.MoveNext();
                            }
                        }
                    }
                }
                function isSESLineToAdd(item, LineItems__) {
                    var shouldBeAdded = true;
                    for (var _i = 0, LineItems__1 = LineItems__; _i < LineItems__1.length; _i++) {
                        var alreadySetLineItem = LineItems__1[_i];
                        if (alreadySetLineItem.Description__ === item.Description__ &&
                            alreadySetLineItem.UnitOfMeasureCode__ === item.UnitOfMeasureCode__ &&
                            alreadySetLineItem.UnitPrice__ === item.UnitPrice__ &&
                            alreadySetLineItem.isFromPO) {
                            shouldBeAdded = false;
                            break;
                        }
                    }
                    return shouldBeAdded;
                }
                function setPOLineItems() {
                    ciData.LineItems__ = new Array();
                    // Retrieve LineItems
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("AP - Purchase order - Items__");
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber)).toString();
                    query.SetFilter(filter);
                    query.SetSortOrder("ItemNumber__ ASC");
                    if (query.MoveFirst()) {
                        var poItemRecord = query.MoveNextRecord();
                        while (poItemRecord) {
                            var item = new CIItemData(poItemRecord.GetVars());
                            item.isFromPO = true;
                            ciData.LineItems__.push(item);
                            setLineItemTax(item);
                            poItemRecord = query.MoveNextRecord();
                        }
                    }
                }
                /**
                 * Set the rigth tax rate and tax amount on the line item
                 * @param {CIItemData} lineItem The CIItemData to update
                 */
                function setLineItemTax(lineItem) {
                    // Synchonous call if the tax rate need a query to get retrieve
                    Lib.AP.TaxHelper.getTaxRate(lineItem.TaxCode__, null, companyCode, null, function (item, taxRates, nonDeductibleTaxRates) {
                        var displayedTaxRate = Array.isArray(taxRates) ? taxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : taxRates;
                        var displayedNonDeductibleTaxRate = Array.isArray(nonDeductibleTaxRates) ? nonDeductibleTaxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : nonDeductibleTaxRates;
                        item.TaxRate__ = displayedTaxRate.toFixed(3);
                        item.NonDeductibleTaxRate__ = (displayedNonDeductibleTaxRate || 0).toFixed(3);
                    }, lineItem);
                    lineItem.TaxAmount__ = Lib.AP.ApplyTaxRate(lineItem.ExpectedAmount__, lineItem.TaxRate__, "");
                }
                function setVendorInformations() {
                    var user = Lib.AP.VendorPortal.GetVendor({
                        vendorNumber: vendorNumber,
                        companyCode: companyCode
                    });
                    ciData.Vendor__.Name = user.GetValue("Company");
                    ciData.Vendor__.Street = user.GetValue("Street");
                    ciData.Vendor__.PostalCode = user.GetValue("ZipCode");
                    ciData.Vendor__.City = user.GetValue("City");
                    ciData.Vendor__.Country = user.GetValue("Country");
                    ciData.Vendor__.Region = user.GetValue("MailState");
                    ciData.Vendor__.PostOfficeBox = user.GetValue("POBox");
                }
                function setCompanyInformations() {
                    var companyProperties = Lib.AP.VendorPortal.GetOrCreateCompanyExtendedProperties(vendorNumber, companyCode);
                    if (!companyProperties) {
                        Log.Error("Cannot retrieve company extended properties for " + companyCode + " " + vendorNumber);
                        return;
                    }
                    var companyVars = companyProperties.GetVars();
                    ciData.Vendor__.VATNumber = companyVars.GetValue_String("VATNumber__", 0);
                    ciData.Vendor__.TaxCode = companyVars.GetValue_String("SIRET__", 0);
                    ciData.PaymentTerms__ = companyVars.GetValue_String("PaymentTerms__", 0);
                    ciData.SpecificMentions__ = companyVars.GetValue_String("SpecificMentions__", 0);
                }
                ciData = initWithHeaderInformations();
                if (ciData !== null) {
                    setVendorInformations();
                    setCompanyInformations();
                    setBillToInformations();
                    setPOLineItems();
                    if (additionnalData && additionnalData.customerOrderIdentifier) {
                        setSESLineItems();
                    }
                    ciData.computeHeaderAmounts();
                }
                return ciData;
            }
            VendorPortal.createCIDataFromPO = createCIDataFromPO;
            /**
             *  @this CustomerInvoiceContact
             */
            function fillData(val, key) {
                if (key === "Vendor__" || key === "BillTo__") {
                    this[key] = new CustomerInvoiceContact();
                    Sys.Helpers.Object.ForEach(val, fillData, this[key]);
                }
                else {
                    this[key] = val;
                }
            }
            function createCIDataFromJSON(json) {
                var ciData = new CIData();
                var inputData = JSON.parse(json);
                Sys.Helpers.Object.ForEach(inputData, fillData, ciData);
                return ciData;
            }
            VendorPortal.createCIDataFromJSON = createCIDataFromJSON;
            function getDate(date) {
                return date ? date.toString().slice(0, 10) : "1900-01-01";
            }
        })(VendorPortal = AP.VendorPortal || (AP.VendorPortal = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
