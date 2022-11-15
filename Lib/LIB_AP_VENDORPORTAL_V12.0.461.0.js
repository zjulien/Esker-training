///#GLOBALS Sys Lib
/* LIB_DEFINITION{
  "name": "LIB_AP_VendorPortal_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_AP_V12.0.461.0",
    "LIB_P2P_V12.0.461.0",
    "Lib_P2P_Conversation_Server_V12.0.461.0",
    "Sys/Sys_EmailNotification",
    "Sys/Sys_Helpers_String",
    "[Lib_AP_Customization_VendorPortal]",
    "LIB_AP_VendorPortal_CIData_V12.0.461.0",
    "LIB_AP_VendorPortal_CreateFromFlipPO_V12.0.461.0",
    "Lib_CallScheduledAction_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var VendorPortal;
        (function (VendorPortal) {
            var _a;
            var cacheUsers = {};
            var cacheVendors = {};
            var newVendorEmail = false;
            VendorPortal.publishOnReject = false;
            var vendorNotified = false;
            /*	Map VIP status to CI status
                The statusThreshold indicates if an update is necessary
                If the statusThreshold at the end of the validation script if < the one at the begin, the CI is not updated
            */
            VendorPortal.statusVIPtoCI = (_a = {},
                _a[Lib.AP.InvoiceStatus.ToVerify] = { name: Lib.AP.CIStatus.AwaitingReception, statusThreshold: 1 },
                _a[Lib.AP.InvoiceStatus.Received] = { name: Lib.AP.CIStatus.AwaitingReception, statusThreshold: 1 },
                _a[Lib.AP.InvoiceStatus.SetAside] = { name: Lib.AP.CIStatus.AwaitingReception, statusThreshold: 1 },
                _a[Lib.AP.InvoiceStatus.ToApprove] = { name: Lib.AP.CIStatus.AwaitingPaymentApproval, statusThreshold: 10 },
                _a[Lib.AP.InvoiceStatus.OnHold] = { name: Lib.AP.CIStatus.AwaitingPaymentApproval, statusThreshold: 10 },
                _a[Lib.AP.InvoiceStatus.ToPost] = { name: Lib.AP.CIStatus.AwaitingPayment, statusThreshold: 20 },
                _a[Lib.AP.InvoiceStatus.ToPay] = { name: Lib.AP.CIStatus.AwaitingPayment, statusThreshold: 30 },
                _a[Lib.AP.InvoiceStatus.Paid] = { name: Lib.AP.CIStatus.Paid, statusThreshold: 40 },
                _a[Lib.AP.InvoiceStatus.Rejected] = { name: Lib.AP.CIStatus.Rejected, statusThreshold: 100 },
                _a);
            /**
            * Returns true if the status of the CI has to be updated
            */
            function NeedUpdateCI(parameters) {
                if (!Lib.AP.VendorPortal.statusOnBegin || !Lib.AP.VendorPortal.statusOnEnd || !Lib.AP.VendorPortal.statusVIPtoCI[VendorPortal.statusOnBegin] || !Lib.AP.VendorPortal.statusVIPtoCI[VendorPortal.statusOnEnd]) {
                    return false;
                }
                // FT-025283 Dynamic discounting offer from vendor portal
                // We must put the CI in state 70, so the vendor can submit an early payment offer.
                // Applies only on posted invoices, that contains a paymentterms configured with dynamic discount
                if (parameters && parameters.PaymentTermEnableDynamicDiscounting
                    && Data.GetValue("ERPPostingDate__")
                    && !(VendorPortal.statusOnBegin === Lib.AP.InvoiceStatus.ToApprove || VendorPortal.statusOnBegin === Lib.AP.InvoiceStatus.ToPay)
                    && (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.ToApprove || VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.ToPay)) {
                    // Update CI after post, to put it in state 70 and allow the vendor to offer dynamic discount
                    return true;
                }
                return Lib.AP.VendorPortal.statusVIPtoCI[Lib.AP.VendorPortal.statusOnBegin].statusThreshold < Lib.AP.VendorPortal.statusVIPtoCI[Lib.AP.VendorPortal.statusOnEnd].statusThreshold;
            }
            VendorPortal.NeedUpdateCI = NeedUpdateCI;
            /**
            * Returns true if the invoice needs to be published
            */
            function NeedCreateCI(parameters) {
                if (Lib.AP.VendorPortal.portalRuidex || !Lib.AP.VendorPortal.statusOnBegin || !Lib.AP.VendorPortal.statusOnEnd || parameters.FromUpdatePayment) {
                    return false;
                }
                return Lib.AP.VendorPortal.statusVIPtoCI[Lib.AP.VendorPortal.statusOnEnd].statusThreshold < 100 || Lib.AP.VendorPortal.publishOnReject;
            }
            VendorPortal.NeedCreateCI = NeedCreateCI;
            /**
            * Returns the transport of the current portalRuidex
            */
            function GetCITransport(fields) {
                var CIQuery = Process.CreateQueryAsProcessAdmin();
                CIQuery.Reset();
                CIQuery.AddAttribute("*");
                Sys.Helpers.Object.ForEach(fields, function (data, field) { return CIQuery.AddAttribute(field); });
                CIQuery.SetFilter("&(RUIDEX=" + Lib.AP.VendorPortal.portalRuidex + ")(State<=100)");
                CIQuery.SetSearchInArchive(true);
                CIQuery.MoveFirst();
                return CIQuery.MoveNext();
            }
            VendorPortal.GetCITransport = GetCITransport;
            function CopyAttachment(toTransport, attachmentIndex) {
                var newAttach = toTransport.AddAttach();
                newAttach.SetAttachFile(Attach.GetAttachConvertedPath(attachmentIndex));
                var attachVars = newAttach.GetVars();
                attachVars.AddValue_String("AttachOutputName", Attach.GetName(attachmentIndex), true);
            }
            function copyMainDocument(toTransport) {
                var nbAttach = Attach.GetNbAttach();
                var HRToAttach = Variable.GetValueAsString("HumanReadableAttachmentName");
                for (var i = 0; i < nbAttach; i++) {
                    if (HRToAttach && HRToAttach === Attach.GetName(i)) {
                        CopyAttachment(toTransport, i);
                        break;
                    }
                    if (Attach.IsProcessedDocument(i)) {
                        CopyAttachment(toTransport, i);
                        break;
                    }
                }
            }
            function copyAllDocuments(toTransport) {
                var nbAttach = Attach.GetNbAttach();
                for (var i = 0; i < nbAttach; i++) {
                    var attach = Attach.GetAttach(i);
                    if (Lib.AP.CustomerInvoiceType.isFlipPO() && Attach.GetConvertedFile(i)) {
                        Log.Info("FlipPO - Adding converted version of", Attach.GetName(i), "to the VIP");
                        attach = Attach.GetConvertedFile(i);
                    }
                    var newAttach = toTransport.AddAttachEx(attach);
                    var attachVars = newAttach.GetVars();
                    attachVars.AddValue_String("IsTechnical", Attach.GetAttach(i).GetVars().GetValue_String("IsTechnical", 0), true);
                    attachVars.AddValue_String("AttachOutputName", Attach.GetName(i), true);
                    if (Attach.IsProcessedDocument(i)) {
                        attachVars.AddValue_String("AttachToProcess", "1", true);
                    }
                }
            }
            function addJSONAttachment(toTransport, jsonContent, attachName) {
                var jsonAttach = toTransport.AddAttach();
                var jsonAttachVars = jsonAttach.GetVars();
                jsonAttachVars.AddValue_String("AttachContent", JSON.stringify(jsonContent), true);
                jsonAttachVars.AddValue_String("AttachType", "inline", true);
                jsonAttachVars.AddValue_String("AttachOutputName", attachName, true);
                jsonAttachVars.AddValue_Long("isTechnical", 1, true);
            }
            /**
            * Publish the invoice on the vendor portal
            */
            function CreateCITransport(parameters, fieldsToUpdate) {
                var vendorUser = Lib.AP.VendorPortal.GetVendorUserWithTolerance(parameters);
                if (!vendorUser) {
                    if (Sys.Parameters.GetInstance("AP").GetParameter("EnablePortalAccountCreation") === "0") {
                        Log.Error("Vendor portal account creation is not activated in account configuration");
                        return null;
                    }
                    vendorUser = Lib.AP.VendorPortal.CreateNewVendorFromTemplate(parameters);
                    if (!vendorUser) {
                        Log.Error("Cannot retrieve Customer invoice owner id, CI transport is not created");
                        return null;
                    }
                    Log.Info("New vendor contact created.");
                }
                var vendorUserLogin = vendorUser.GetValue("login");
                Log.Info("Publishing invoice to vendor portal ".concat(vendorUserLogin));
                // shorLogin stands for vendorLogin. vendorLogin is built as follow: {accountId}${shortLogin}
                Variable.SetValueAsString("shorLogin", vendorUserLogin);
                var CITransport = Process.CreateProcessInstanceForUser("Customer invoice", vendorUserLogin, 0, true);
                copyMainDocument(CITransport);
                UpdateCI(CITransport, fieldsToUpdate, null, parameters);
                if (CITransport.GetLastError() === 0) {
                    var CIVars = CITransport.GetUninheritedVars();
                    Data.SetValue("PortalRuidex__", CIVars.GetValue_String("RUIDEX", 0));
                    return CITransport;
                }
                Log.Error("Cannot create CI transport ".concat(CITransport.GetLastError(), ": ").concat(CITransport.GetLastErrorMessage()));
                return null;
            }
            VendorPortal.CreateCITransport = CreateCITransport;
            function GetDefaultApUserLogin() {
                var userExitDeterminedOwner = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.DetermineVendorInvoiceOwner");
                if (!userExitDeterminedOwner) {
                    var defaultAPClerk = Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerk");
                    if (defaultAPClerk) {
                        return defaultAPClerk;
                    }
                    Log.Warn("A Default AP Clerk should be defined in Application Settings");
                    return Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("AP").GetParameter("VendorInvoiceOwner"));
                }
                return userExitDeterminedOwner;
            }
            VendorPortal.GetDefaultApUserLogin = GetDefaultApUserLogin;
            function CreateVIPTransport() {
                var apUserLogin = GetDefaultApUserLogin();
                if (!apUserLogin) {
                    Log.Error("Cannot retrieve default AP clerk for selected billed entity");
                    return false;
                }
                var VIPTransport = Process.CreateProcessInstanceForUser("Vendor invoice", apUserLogin, 1, true);
                if (VIPTransport) {
                    copyAllDocuments(VIPTransport);
                    if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
                        // Build and add JSON attachment to be processed by the VIP
                        var ciData = Lib.AP.VendorPortal.CreateFromFlipPO.readCiDataFromAttach();
                        if (!ciData) {
                            Log.Error("Unable to read the attachment");
                            return false;
                        }
                        addJSONAttachment(VIPTransport, ciData.toVIPData(Lib.AP.VendorPortal.CreateFromFlipPO.getCIDataFromForm()), "vendorinvoice.json");
                    }
                    var vars = VIPTransport.GetUninheritedVars();
                    vars.AddValue_String("PortalRuidEx__", Data.GetValue("RuidEx"), true);
                    vars.AddValue_String("ReceptionMethod__", Data.GetValue("ReceptionMethod__"), true);
                    VIPTransport.Process();
                    Transaction.Write("VIPTransportRuidEx", vars.GetValue_String("RuidEx", 0));
                    Data.SetValue("VIRuidEx__", vars.GetValue_String("RuidEx", 0));
                    return VIPTransport.GetLastError() === 0;
                }
                return false;
            }
            VendorPortal.CreateVIPTransport = CreateVIPTransport;
            function UpdateOwnerIfNeeded(ciTrn, ciVars, jsonCiVars, parameters) {
                var currentOwner = ciVars.GetValue_String("OwnerId", 0);
                if (!currentOwner) {
                    return;
                }
                // Check if the CI is owned by the correct vendor (AP Specialist may have changed the vendor on the invoice)
                var vendorUser = Lib.AP.VendorPortal.GetOrCreateVendor(parameters);
                if (!vendorUser) {
                    Log.Error("Cannot retrieve Customer invoice owner id, CI transport will not change owner if needed");
                    return;
                }
                var vendorUserVars = vendorUser.GetVars();
                var dn = vendorUserVars.GetValue_String("FullDn", 0);
                if (dn !== currentOwner) {
                    Log.Warn("Vendor changed - updating owner of customer invoice to " + vendorUserVars.GetValue_String("login", 0));
                    ciVars.AddValue_String("OwnerId", dn, true);
                    jsonCiVars.OwnerId = dn;
                    ciVars.AddValue_String("PreferredValidationOwnerId", dn, true);
                    jsonCiVars.PreferredValidationOwnerId = dn;
                    NotifyVendorNewInvoice(ciTrn, parameters);
                    // delete old vendor from conversation and add new vendor instead
                    TryToDeleteExistingVendorConversation();
                    var vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
                    var recipientCompany = GetCompanyName(Data.GetValue("CompanyCode__"));
                    var ciRuidEx = Data.GetValue("PortalRuidex__");
                    AddPartyToConversation(vendorInfo, recipientCompany, ciRuidEx);
                    // Update internal conversations recipient company with new vendor name
                    TryToUpdateExistingInternalConversations();
                }
            }
            function TryToDeleteExistingVendorConversation() {
                var ciRuidEx = Data.GetValue("PortalRuidex__");
                var deletedPartiesCount = Conversation.DeleteParties(Lib.P2P.Conversation.TableName, {
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.BusinessPartnerId,
                    RuidEx: ciRuidEx
                });
                Log.Info("Deleted parties: ".concat(deletedPartiesCount));
            }
            VendorPortal.TryToDeleteExistingVendorConversation = TryToDeleteExistingVendorConversation;
            function TryToUpdateExistingInternalConversations() {
                var updatedPartiesCount = Conversation.UpdateParties(Lib.P2P.Conversation.TableName, {
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.OwnerId
                }, {
                    RecipientCompany: Data.GetValue("VendorName__")
                });
                Log.Info("Updated parties: ".concat(updatedPartiesCount));
            }
            VendorPortal.TryToUpdateExistingInternalConversations = TryToUpdateExistingInternalConversations;
            /**
            * Read the current state and update the CI if needed
            * Return true if the transport have been updated with the values
            * transport should exists
            */
            function UpdateCI(transport, fields, overrideProcessMethod, parameters, updateAsync) {
                var vars = transport.GetUninheritedVars();
                var jsonVars = { fields: {} };
                if (!vars) {
                    Log.Error("UpdateCI: null transport' vars");
                    return false;
                }
                if (parameters && parameters.CheckOwner) {
                    UpdateOwnerIfNeeded(transport, vars, jsonVars.fields, parameters);
                }
                var isWaiting = vars.GetValue_Long("WaitingForUpdate", 0) > 0;
                var CIState = vars.GetValue_Long("State", 0);
                for (var field in fields) {
                    if (field === "IsClosed") {
                        // Do not set IsClosed if the form is not waiting for update or in pass of rejection
                        // Else, it will prevent the validation and finalization scripts to be executed.
                        if (isWaiting) {
                            vars.AddValue_String(field, fields[field].value, true);
                            jsonVars.fields[field] = fields[field].value;
                        }
                    }
                    else if (fields[field].type === "string") {
                        vars.AddValue_String(field, fields[field].value, true);
                        jsonVars.fields[field] = fields[field].value;
                    }
                    else if (fields[field].type === "date" && fields[field].value && fields[field].value.length !== 0) {
                        //Cannot add an empty value
                        vars.AddValue_Date(field, fields[field].value, true);
                        jsonVars.fields[field] = Sys.Helpers.Date.Date2DBDateTime(fields[field].value);
                    }
                    else if (fields[field].type === "long") {
                        vars.AddValue_Long(field, fields[field].value, true);
                        jsonVars.fields[field] = fields[field].value;
                    }
                    else if (fields[field].type === "double") {
                        vars.AddValue_Double(field, fields[field].value, true);
                        jsonVars.fields[field] = fields[field].value;
                    }
                    else if (fields[field].value) {
                        Log.Error("Can not add type:" + fields[field].type + " in vars for the value:" + fields[field].value + ".The field will not be updated");
                    }
                }
                try {
                    if (Sys.Helpers.IsFunction(overrideProcessMethod)) {
                        return overrideProcessMethod(transport);
                    }
                    if ((VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Paid || VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected) && CIState === 70) {
                        // CI to state 100
                        var ownershipToken = "InvoiceBeingPaid_" + vars.GetValue_String("RuidEx", 0);
                        var transportUpdated = false;
                        if (transport.GetAsyncOwnership(ownershipToken, 20000) === 0) {
                            vars.AddValue_String("RequestedActions", "approve|", true);
                            vars.AddValue_String("NeedValidation", "0", true);
                            transportUpdated = !!transport.Validate("");
                            transport.ReleaseAsyncOwnership(ownershipToken);
                        }
                        return transportUpdated;
                    }
                    // FT-023330 : CI may be unavailable for update because of the UpdateCount action made by the conncont so we ask for async update
                    if (updateAsync) {
                        var ruidEx = vars.GetValue_String("RuidEx", 0);
                        Log.Info("Update async Customer Invoice ".concat(ruidEx));
                        return Process.UpdateProcessInstanceDataAsync(ruidEx, JSON.stringify(jsonVars));
                    }
                    transport.Process();
                    return transport.GetLastError() === 0;
                }
                catch (e) {
                    Log.Error("UpdateCI: Customer invoice could not be updated: " + e);
                    return false;
                }
            }
            VendorPortal.UpdateCI = UpdateCI;
            /**
            * Map with the payment details
            */
            function UpdatePaymentDetails(fields, parameters) {
                if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Paid && parameters.PaymentDate__) {
                    fields.Payment_date__ = { value: parameters.PaymentDate__, type: "date" };
                    fields.Payment_method__ = { value: parameters.Payment_method__, type: "string" };
                    fields.Payment_reference__ = { value: parameters.PaymentReference__, type: "string" };
                }
            }
            /**
            * Map with the invoice details
            */
            function UpdateInvoiceDetails(fields, parameters) {
                if (VendorPortal.statusOnEnd !== Lib.AP.InvoiceStatus.Paid && !parameters.Reversed) {
                    var company = GetCompanyName(parameters.CompanyCode__);
                    fields.Company__ = { value: company, type: "string" };
                    fields.VIRuidEx__ = { value: parameters.VIRuidEx__, type: "string" };
                    fields.Net_amount__ = { value: parameters.Net_amount__, type: "double" };
                    fields.Invoice_amount__ = { value: parameters.Invoice_amount__, type: "double" };
                    fields.Invoice_date__ = { value: parameters.Invoice_date__, type: "date" };
                    fields.Currency__ = { value: parameters.Currency__, type: "string" };
                    fields.Due_date__ = { value: parameters.Due_date__, type: "date" };
                    fields.PaymentTerms__ = { value: parameters.PaymentTermDescription, type: "string" };
                    fields.PaymentTermEnableDynamicDiscounting__ = { value: parameters.PaymentTermEnableDynamicDiscounting, type: "string" };
                    fields.PaymentTermDayLimit__ = { value: parameters.PaymentTermDayLimit, type: "string" };
                    // empty values could occure inc ase of auto-reject
                    // but Invoice_number__ is a required field, only copy non-empty values
                    if (!Sys.Helpers.IsEmpty(parameters.Invoice_number__)) {
                        fields.Invoice_number__ = { value: parameters.Invoice_number__, type: "string" };
                    }
                }
                if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected) {
                    fields.RejectReason__ = { value: parameters.RejectReason__, type: "string" };
                }
                if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.ToPay || VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Paid || VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected) {
                    // Allow the Customer Invoice to terminate
                    fields.IsClosed = { value: "1", type: "string" };
                }
            }
            /**
            * Map with the payment details
            */
            function UpdateDiscountDetails(fields, parameters) {
                if (!parameters.Reversed) {
                    fields.PaymentTermDiscountRate__ = { value: parameters.PaymentTermDiscountRate, type: "double" };
                    // payment discount panel
                    if (parameters.DiscountLimitDate__) {
                        fields.DiscountLimitDate__ = { value: parameters.DiscountLimitDate__, type: "date" };
                    }
                    if (parameters.EstimatedDiscountAmount__ || parameters.DiscountPercent__) {
                        fields.EstimatedDiscountAmount__ = { value: parameters.EstimatedDiscountAmount__, type: "double" };
                        fields.DiscountPercent__ = { value: parameters.DiscountPercent__, type: "double" };
                    }
                    var discountState = Lib.AP.CIDiscountState.NotRequested;
                    if (parameters.PaymentTermDiscountRate && !parameters.PaymentTermEnableDynamicDiscounting) {
                        discountState = Lib.AP.CIDiscountState.Static;
                    }
                    fields.DiscountState__ = { value: discountState, type: "string" };
                }
            }
            /**
            * Create a map with the field to update
            */
            function GetFieldsToUpdate(parameters) {
                var fields = {
                    CustomerInvoiceStatus__: { value: VendorPortal.statusVIPtoCI[VendorPortal.statusOnEnd || parameters.Invoice_status__].name, type: "string" }
                };
                UpdateInvoiceDetails(fields, parameters);
                UpdatePaymentDetails(fields, parameters);
                UpdateDiscountDetails(fields, parameters);
                return fields;
            }
            VendorPortal.GetFieldsToUpdate = GetFieldsToUpdate;
            /**
            * Returns the value to use to match a vendor from AP - Vendors link to a vendor in the AP - Vendors table
            */
            function GetPortalVendorId(parameters) {
                return parameters.VendorNumber__;
            }
            VendorPortal.GetPortalVendorId = GetPortalVendorId;
            /**
            * Returns the value to use to match a vendor from AP - Vendors link to a vendor in the AP - Vendors table
            */
            function GetPortalCompanyCodeId(parameters) {
                return parameters.CompanyCode__;
            }
            /**
            * Compute the short version of the vendor portal login based on the invoice informations
            * The accountId is not included in this version
            * By modifying this function, you can customize how you want to build vendor login (just make sure the value returned is a valid login)
            * <!> The identifier can only contain letters, numbers, dots (.), dashes (-), underscores (_) and arrobases (@).
            * This function build a login from the vendor name or the vendor number, after removing all caracters but [a-z0-9_]
            **/
            function BuildNewPortalShortLogin(parameters) {
                /**
                * When a vendor already exists with the same name, add a random number to build the login
                */
                function GetRandom() {
                    return Math.floor((Math.random() * 100000) + 1);
                }
                var maxLength = 60;
                var newLogin = "";
                if (parameters) {
                    if (parameters.shortLogin) {
                        newLogin = parameters.shortLogin;
                    }
                    var temp = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.SetNewShortLogin", newLogin);
                    newLogin = temp ? temp : newLogin;
                    if (newLogin.length === 0) {
                        if (parameters.VendorName__) {
                            newLogin += parameters.VendorName__.toString();
                        }
                        if (newLogin.length === 0 && parameters.VendorNumber__) {
                            newLogin += parameters.VendorNumber__.toString();
                        }
                        newLogin = newLogin.RemoveAccents().replace(/\W/g, "");
                    }
                    if (newLogin.length !== 0) {
                        newLogin = newLogin.substr(0, maxLength);
                        newLogin = newLogin.toLowerCase();
                        var userX = Lib.AP.VendorPortal.GetVendor({ shortLogin: newLogin });
                        //If a user already exists with the same login, add a random number after the vendor name
                        while (userX) {
                            //Remove previous random value
                            if (newLogin.indexOf("_") !== -1) {
                                newLogin = newLogin.substring(0, newLogin.indexOf("_"));
                            }
                            var randomValue = GetRandom().toString();
                            if (newLogin.length > maxLength - randomValue.length) {
                                newLogin = newLogin.substr(0, maxLength - randomValue.length);
                            }
                            newLogin += "_" + randomValue;
                            newLogin = newLogin.toLowerCase();
                            userX = Lib.AP.VendorPortal.GetVendor({ shortLogin: newLogin });
                        }
                    }
                }
                return newLogin;
            }
            VendorPortal.BuildNewPortalShortLogin = BuildNewPortalShortLogin;
            function GetRecord(vendorNumber, companyCode, tableName) {
                if (!vendorNumber) {
                    Log.Warn("GetRecord : No vendor number, cannot find vendor in " + tableName);
                    return null;
                }
                var filter = "(Number__=" + vendorNumber + ")";
                if (companyCode) {
                    filter = filter.AddCompanyCodeFilter(companyCode);
                }
                var query = Process.CreateQueryAsProcessAdmin();
                query.SetSpecificTable(tableName);
                query.SetFilter(filter);
                query.MoveFirst();
                return query.MoveNextRecord();
            }
            function GetVendorLinkRecord(vendorNumber, companyCode) {
                return GetRecord(vendorNumber, companyCode, "AP - Vendors links__");
            }
            function GetVendorRecord(vendorNumber, companyCode) {
                return GetRecord(vendorNumber, companyCode, "AP - Vendors__");
            }
            VendorPortal.GetVendorRecord = GetVendorRecord;
            /**
             * Returns a User object representing the vendor
             */
            function GetVendor(params) {
                //On the 'Flip PO' process, the owner could be the expected vendor
                var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                var isVendor = currentUser.GetValue("VENDOR");
                var vendor = null;
                if (isVendor === "1") {
                    vendor = currentUser;
                }
                else {
                    var accountid = Lib.AP.VendorPortal.GetCurrentUser().GetVars().GetValue_String("accountid", 0);
                    if (!params.shortLogin) {
                        var record = GetVendorLinkRecord(params.vendorNumber, params.companyCode);
                        if (record) {
                            params.shortLogin = record.GetVars().GetValue_String("ShortLogin__", 0);
                        }
                    }
                    if (!params.shortLogin) {
                        Log.Info("GetVendor: can't find vendor without short login");
                        return null;
                    }
                    vendor = Users.GetUserAsProcessAdmin(accountid + "$" + params.shortLogin);
                }
                if (!Sys.Helpers.IsEmpty(params.VendorContactEmail__) && vendor && Sys.Helpers.IsEmpty(vendor.GetValue("EmailAddress"))) {
                    Log.Info("GetVendor: We update the vendor with a new email Address : " + params.VendorContactEmail__);
                    vendor.SetValue("EmailAddress", params.VendorContactEmail__);
                    newVendorEmail = true;
                    //Need to send welcome Email to this Vendor as it is likely the first time he will receive a mail from us
                }
                return vendor;
            }
            VendorPortal.GetVendor = GetVendor;
            function GetCurrentUser() {
                if (Variable.GetValueAsString("CurrentUserId") in cacheUsers) {
                    return cacheUsers[Variable.GetValueAsString("CurrentUserId")];
                }
                else if (Data.GetValue("OwnerId") in cacheUsers) {
                    return cacheUsers[Data.GetValue("OwnerId")];
                }
                var curUser = Users.GetUser(Variable.GetValueAsString("CurrentUserId"));
                if (!curUser) {
                    curUser = Users.GetUser(Data.GetValue("OwnerId"));
                    if (curUser) {
                        cacheUsers[Data.GetValue("OwnerId")] = curUser;
                    }
                }
                else {
                    cacheUsers[Variable.GetValueAsString("CurrentUserId")] = curUser;
                }
                return curUser;
            }
            VendorPortal.GetCurrentUser = GetCurrentUser;
            /**
            * Send a notification to the vendor
            **/
            function NotifyVendor(customerInvoiceTrn, subject, template, customTags, curUser) {
                vendorNotified = true;
                if (curUser) {
                    cacheUsers[Variable.GetValueAsString("CurrentUserId")] = curUser;
                }
                var vars = customerInvoiceTrn.GetUninheritedVars();
                var vendorUser = Lib.AP.VendorPortal.GetVendorUser(customTags);
                if (vendorUser) {
                    var trnRuidEx = vars.GetValue_String("RUIDEX", 0);
                    curUser = Lib.AP.VendorPortal.GetCurrentUser();
                    var curUserVars = curUser.GetVars();
                    if (!customTags) {
                        customTags = {};
                    }
                    Lib.AP.VendorPortal.AddFormattedValues(customTags, vendorUser);
                    customTags.CompanyName__ = curUserVars.GetValue_String("Company", 0);
                    customTags.PortalUrl = vendorUser.GetProcessURL(trnRuidEx, true);
                    var vendorEmail = Lib.P2P.computeVendorEmailRedirection(vendorUser.GetValue("EmailAddress"));
                    if (vendorEmail) {
                        var emailOptions = {
                            "subject": subject,
                            "template": template,
                            "customTags": customTags
                        };
                        var doSendNotif = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnSendVendorNotification", emailOptions);
                        if (doSendNotif !== false) {
                            var email = Sys.EmailNotification.CreateEmailWithUser(vendorUser, vendorEmail, emailOptions.subject, emailOptions.template, emailOptions.customTags, true);
                            if (email) {
                                Sys.EmailNotification.SendEmail(email);
                            }
                        }
                    }
                }
            }
            VendorPortal.NotifyVendor = NotifyVendor;
            function NotifyVendorNewInvoice(transport, parameters) {
                var subject = {
                    key: "_Customer invoice received",
                    parameters: [parameters.Invoice_number__]
                };
                var template;
                if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected && newVendorEmail) {
                    subject.key = "_Customer invoice rejected";
                    template = "AP-Vendor_InvoiceRejected_WelcomEmail_XX.htm";
                }
                else if (newVendorEmail) {
                    template = "AP-Vendor_InvoicePublished_WelcomEmail_XX.htm";
                }
                else if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected) {
                    subject.key = "_Customer invoice rejected";
                    template = "AP-Vendor_InvoiceRejected_XX.htm";
                }
                else {
                    template = "AP-Vendor_InvoicePublished.htm";
                }
                NotifyVendor(transport, subject, template, parameters);
            }
            function NotifyVendorRejectedInvoice(transport, parameters) {
                var subject = {
                    key: "_Customer invoice rejected",
                    parameters: [parameters.Invoice_number__]
                };
                Lib.AP.VendorPortal.NotifyVendor(transport, subject, "AP-Vendor_InvoiceRejected_XX.htm", parameters);
            }
            function GetVendorInfo(parameters) {
                var attributes = {};
                attributes.Description = GetPortalVendorId(parameters);
                attributes.Company = parameters.VendorName__;
                attributes.emailaddress = parameters.VendorContactEmail__ || "";
                attributes.firstname = parameters.FirstName__ || "";
                attributes.lastname = parameters.LastName__ || "";
                if (parameters.VendorContactEmail__) {
                    Log.Info("GetVendorInfo creating the vendor with a new email Address: " + parameters.VendorContactEmail__);
                    newVendorEmail = true;
                }
                if (parameters.Language && parameters.Culture) {
                    attributes.TimeZoneIdentifier = parameters.TimeZoneIdentifier;
                    attributes.Language = parameters.Language;
                    attributes.Culture = parameters.Culture;
                }
                else {
                    var curUser = Lib.AP.VendorPortal.GetCurrentUser();
                    var curUserVars = curUser.GetVars();
                    attributes.TimeZoneIdentifier = curUserVars.GetValue_String("TimeZoneIdentifier", 0);
                    attributes.Language = curUserVars.GetValue_String("Language", 0);
                    attributes.Culture = curUserVars.GetValue_String("Culture", 0);
                }
                // Try to fill other attributes from AP - Vendors table
                var record = GetVendorRecord(parameters.VendorNumber__, parameters.CompanyCode__);
                if (record) {
                    var vars = record.GetVars();
                    attributes.Name = vars.GetValue_String("Name__", 0);
                    attributes.Company = parameters.VendorName__ || attributes.Name;
                    attributes.Sub = vars.GetValue_String("Sub__", 0);
                    attributes.Street = vars.GetValue_String("Street__", 0);
                    attributes.POBox = vars.GetValue_String("PostOfficeBox__", 0);
                    attributes.City = vars.GetValue_String("City__", 0);
                    attributes.ZipCode = vars.GetValue_String("PostalCode__", 0);
                    attributes.MailState = vars.GetValue_String("Region__", 0);
                    attributes.FaxNumber = vars.GetValue_String("FaxNumber__", 0);
                    attributes.Country = vars.GetValue_String("Country__", 0);
                    attributes.PhoneNumber = vars.GetValue_String("PhoneNumber__", 0);
                }
                return attributes;
            }
            function GetCompanyName(companyCode) {
                if (!companyCode) {
                    return "";
                }
                var companyName = companyCode;
                var query = Process.CreateQuery();
                query.Reset();
                query.SetSpecificTable("PurchasingCompanycodes__");
                query.SetAttributesList("CompanyName__");
                query.SetFilter("CompanyCode__=" + companyCode);
                query.MoveFirst();
                var record = query.MoveNextRecord();
                if (record) {
                    companyName = record.GetVars().GetValue_String("CompanyName__", 0);
                }
                return companyName;
            }
            VendorPortal.GetCompanyName = GetCompanyName;
            function CreateOrUpdateVendorLink(newUser, parameters, fillShortLoginPAC) {
                var vendorLogin = Lib.P2P.GetShortLoginFromUser(newUser);
                var rec = GetVendorLinkRecord(parameters.VendorNumber__, parameters.CompanyCode__);
                if (rec) {
                    rec.GetVars().AddValue_String("ShortLogin__", vendorLogin, true);
                    if (fillShortLoginPAC) {
                        rec.GetVars().AddValue_String("ShortLoginPAC__", vendorLogin, true);
                    }
                    rec.Commit();
                }
                else {
                    rec = Process.CreateTableRecord("AP - Vendors links__");
                    if (rec) {
                        var vars = rec.GetVars();
                        vars.AddValue_String("Number__", parameters.VendorNumber__, true);
                        vars.AddValue_String("CompanyCode__", parameters.CompanyCode__, true);
                        vars.AddValue_String("ShortLogin__", vendorLogin, true);
                        vars.AddValue_String("Configuration__", parameters.Configuration__, true);
                        if (fillShortLoginPAC) {
                            vars.AddValue_String("ShortLoginPAC__", vendorLogin, true);
                        }
                        rec.Commit();
                    }
                }
            }
            VendorPortal.CreateOrUpdateVendorLink = CreateOrUpdateVendorLink;
            function CreateOrUpdateP2PVendorRecord(parameters) {
                var rec = Lib.AP.VendorPortal.GetVendorRecord(parameters.VendorNumber__, parameters.CompanyCode__);
                var vars;
                if (!rec) {
                    rec = Process.CreateTableRecord("AP - Vendors__");
                    if (rec) {
                        vars = rec.GetVars();
                        vars.AddValue_String("CompanyCode__", parameters.CompanyCode__, true);
                        vars.AddValue_String("Number__", parameters.VendorNumber__, true);
                    }
                }
                else {
                    vars = rec.GetVars();
                }
                if (rec) {
                    vars.AddValue_String("Name__", parameters.Company__, true);
                    vars.AddValue_String("Sub__", parameters.MailSub__, true);
                    vars.AddValue_String("Street__", parameters.Street__, true);
                    vars.AddValue_String("PostOfficeBox__", parameters.POBox__, true);
                    vars.AddValue_String("PostalCode__", parameters.Zip_Code__, true);
                    vars.AddValue_String("City__", parameters.City__, true);
                    vars.AddValue_String("Region__", parameters.Mail_State__, true);
                    vars.AddValue_String("Country__", parameters.Country__, true);
                    vars.AddValue_String("PhoneNumber__", parameters.Phone_Number__, true);
                    vars.AddValue_String("FaxNumber__", parameters.Fax_Number__, true);
                    vars.AddValue_String("VATNumber__", parameters.TaxID__, true);
                    vars.AddValue_String("DUNSNumber__", parameters.VendorRegistrationDUNSNumber__, true);
                    vars.AddValue_String("Email__", parameters.Email__, true);
                    rec.Commit();
                    if (rec.GetLastError()) {
                        Log.Error("CreateOrUpdateP2PVendorRecord " + rec.GetLastError());
                        return false;
                    }
                    return true;
                }
                return false;
            }
            VendorPortal.CreateOrUpdateP2PVendorRecord = CreateOrUpdateP2PVendorRecord;
            function CreateNewVendorFromTemplate(parameters) {
                var templateUser = Lib.AP.VendorPortal.GetVendor({ shortLogin: "_vendor_template_" });
                if (templateUser) {
                    var attributes = GetVendorInfo(parameters);
                    if (!parameters.VendorName__) {
                        parameters.VendorName__ = attributes.Name;
                    }
                    var newUser = null;
                    try {
                        newUser = templateUser.Clone(Lib.AP.VendorPortal.BuildNewPortalShortLogin(parameters), attributes);
                    }
                    catch (ex) {
                        // when 2 invoices for the same vendor are processed at the same time while the vendor contact doesn't exist
                        // we may have constraint violation when creating it the second time.
                        // In that case retunr the previously created vendor contact
                        Log.Warn("Template user clone failed: " + ex);
                        return Lib.AP.VendorPortal.GetVendorUser(parameters);
                    }
                    //Add the new User in the CT
                    if (newUser) {
                        Lib.AP.VendorPortal.CreateOrUpdateVendorLink(newUser, parameters, true);
                    }
                    return newUser;
                }
                return null;
            }
            VendorPortal.CreateNewVendorFromTemplate = CreateNewVendorFromTemplate;
            function GetOrCreateVendor(parameters) {
                var vendorUser = Lib.AP.VendorPortal.GetVendorUserWithTolerance(parameters);
                if (!vendorUser) {
                    vendorUser = Lib.AP.VendorPortal.CreateNewVendorFromTemplate(parameters);
                }
                return vendorUser;
            }
            VendorPortal.GetOrCreateVendor = GetOrCreateVendor;
            function GetVendorUserWithTolerance(parameters) {
                var vendorUser = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.MatchVendorContact", parameters);
                if (!vendorUser) {
                    vendorUser = Lib.AP.VendorPortal.GetVendorUser(parameters);
                }
                if (!vendorUser) {
                    Log.Info("Vendor contact not found. Search for contact from other company code.");
                    // 1st lookup did not find, start 2nd lookup
                    if (!parameters.VendorName__) {
                        var attributes = GetVendorInfo(parameters);
                        parameters.VendorName__ = attributes.Name;
                    }
                    var filter = "(&(Number__=" + parameters.VendorNumber__ + ")(Name__=" + parameters.VendorName__ + "))";
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("AP - Vendors__");
                    query.SetAttributesList("CompanyCode__");
                    query.SetFilter(filter);
                    vendorUser = Lib.AP.VendorPortal.LookUpVendorContact(parameters, query);
                }
                return vendorUser;
            }
            VendorPortal.GetVendorUserWithTolerance = GetVendorUserWithTolerance;
            function LookUpVendorContact(parameters, query) {
                if (query.MoveFirst()) {
                    var vendorRecord = query.MoveNextRecord();
                    while (vendorRecord) {
                        var vendorVars = vendorRecord.GetVars();
                        if (vendorVars) {
                            var parametersUpdated = Sys.Helpers.Clone(parameters);
                            parametersUpdated.CompanyCode__ = vendorVars.GetValue_String("CompanyCode__", 0);
                            var vendorUser = Lib.AP.VendorPortal.GetVendorUser(parametersUpdated);
                            if (vendorUser) {
                                // 2nd lookup found vendor, create vendor link to find on 1st lookup next time
                                Lib.AP.VendorPortal.CreateOrUpdateVendorLink(vendorUser, parameters, true);
                                Log.Info("Vendor contact found with company code ".concat(parametersUpdated.CompanyCode__, "."));
                                return vendorUser;
                            }
                        }
                        vendorRecord = query.MoveNextRecord();
                    }
                }
                return null;
            }
            VendorPortal.LookUpVendorContact = LookUpVendorContact;
            function GetVendorUser(parameters) {
                var vendorId = GetPortalVendorId(parameters);
                var company = GetPortalCompanyCodeId(parameters);
                var companyCacheName = company ? company : "__default__";
                if (!(vendorId in cacheVendors)) {
                    cacheVendors.vendorId = {};
                }
                if (!(companyCacheName in cacheVendors.vendorId)) {
                    var param = { companyCode: company, vendorNumber: vendorId, VendorContactEmail__: parameters.VendorContactEmail__, shortLogin: null };
                    cacheVendors.vendorId.companyCacheName = Lib.AP.VendorPortal.GetVendor(param);
                    if (param.shortLogin) {
                        parameters.shortLogin = param.shortLogin;
                    }
                }
                return cacheVendors.vendorId.companyCacheName;
            }
            VendorPortal.GetVendorUser = GetVendorUser;
            function AddFormattedValues(parameters, user) {
                var curUser = user ? user : Users.GetUser(Data.GetValue("OwnerId"));
                var dateOptions = {
                    dateFormat: "ShortDate",
                    timeFormat: "None",
                    timeZone: "User"
                };
                if (!parameters) {
                    parameters = {};
                }
                if (curUser) {
                    if ("Due_date__" in parameters && parameters.Due_date__ instanceof Date) {
                        parameters.FormattedDue_date__ = curUser.GetFormattedDate(parameters.Due_date__, dateOptions);
                    }
                    if ("Invoice_date__" in parameters && parameters.Invoice_date__ instanceof Date) {
                        parameters.FormattedInvoice_date__ = curUser.GetFormattedDate(parameters.Invoice_date__, dateOptions);
                    }
                    if ("PaymentDate__" in parameters && parameters.PaymentDate__ instanceof Date) {
                        parameters.FormattedPaymentDate__ = curUser.GetFormattedDate(parameters.PaymentDate__, dateOptions);
                    }
                    if ("NetAmount__" in parameters) {
                        parameters.NetAmount__ = curUser.GetFormattedNumber(parameters.NetAmount__);
                    }
                    if ("Invoice_amount__" in parameters) {
                        parameters.Invoice_amount__ = curUser.GetFormattedNumber(parameters.Invoice_amount__);
                    }
                    if ("PaymentMethod__" in parameters) {
                        parameters.PaymentMethod__ = Language.TranslateInto(parameters.PaymentMethod__, curUser.GetValue("Language"), false);
                    }
                    if ("RejectReason__" in parameters) {
                        parameters.RejectReason__ = Language.TranslateInto(parameters.RejectReason__, curUser.GetValue("Language"), false);
                    }
                }
            }
            VendorPortal.AddFormattedValues = AddFormattedValues;
            /*	No conversation should exist, neither for VIP and CI
                Create a new one on VIP Document,
                then create one on CI Document with previously created conversationID
            */
            function InitiateConversationWithCI(CITransport) {
                var CIVars = CITransport.GetUninheritedVars();
                var ciRuidEx = CIVars.GetValue_String("RUIDEx", 0);
                var vendorUserId = CIVars.GetValue_String("OwnerID", 0);
                var internalUser = Users.GetUserAsProcessAdmin(GetDefaultApUserLogin());
                var internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                var vendorUser = Users.GetUserAsProcessAdmin(vendorUserId);
                var vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
                var conversationId = AddPartyToConversation(internalUserInfo, vendorInfo.Company);
                AddPartyToConversation(vendorInfo, internalUserInfo.Company, ciRuidEx, conversationId);
            }
            /*	No conversation should exist, neither for VIP and CI
                Create a new one on CI Document,
                then create one on VIP Document with previously created conversationID
            */
            function InitiateConversationWithVIP(vendorUserId, VIPRuidex) {
                var internalUser = Users.GetUserAsProcessAdmin(GetDefaultApUserLogin());
                var internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                var vendorUser = Users.GetUserAsProcessAdmin(vendorUserId);
                var vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
                var conversationId = AddPartyToConversation(vendorInfo, internalUserInfo.Company);
                AddPartyToConversation(internalUserInfo, vendorInfo.Company, VIPRuidex, conversationId);
            }
            VendorPortal.InitiateConversationWithVIP = InitiateConversationWithVIP;
            /*	No conversation should exist, neither for VIP and CI
                Create a new one on CI Document
                No conversation created for VIP (it not exists yet)
                VIP will be responsible to create conversations for its contributors
            */
            function InitiateConversationFromCI(vendorUserId) {
                var vendorUser = Users.GetUserAsProcessAdmin(vendorUserId);
                var vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
                var apLogin = GetDefaultApUserLogin();
                var internalUser = Users.GetUserAsProcessAdmin(apLogin);
                if (internalUser) {
                    var internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                    return AddPartyToConversation(vendorInfo, internalUserInfo.Company);
                }
                Log.Error("User ".concat(apLogin, " not found - not added to the conversation"));
                return null;
            }
            VendorPortal.InitiateConversationFromCI = InitiateConversationFromCI;
            function AddPartyToConversation(fromUser, recipientCompany, ruidEx, conversationId) {
                var conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetInvoice(), ruidEx, conversationId);
                var extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                    BusinessId: fromUser.BusinessId,
                    BusinessIdFieldName: fromUser.BusinessIdFieldName,
                    OwnerID: fromUser.OwnerID,
                    OwnerPB: fromUser.OwnerPB,
                    RecipientCompany: recipientCompany
                });
                return Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
            }
            VendorPortal.AddPartyToConversation = AddPartyToConversation;
            function CreateCIAndNotifyVendor(parameters, fieldsToUpdate) {
                var transport = Lib.AP.VendorPortal.CreateCITransport(parameters, fieldsToUpdate);
                if (transport) {
                    InitiateConversationWithCI(transport);
                    NotifyVendorNewInvoice(transport, parameters);
                }
                return transport;
            }
            VendorPortal.CreateCIAndNotifyVendor = CreateCIAndNotifyVendor;
            /**
            * Read the current state and update the CI if needed
            */
            function UpdateCIIfNeeded(parameters) {
                var ci = {
                    transport: null,
                    updated: false
                };
                if (Lib.AP.VendorPortal.NeedUpdateCI(parameters)) {
                    var fieldsToUpdate = Lib.AP.VendorPortal.GetFieldsToUpdate(parameters);
                    if (Lib.AP.VendorPortal.NeedCreateCI(parameters)) {
                        ci.transport = Lib.AP.VendorPortal.CreateCIAndNotifyVendor(parameters, fieldsToUpdate);
                        ci.updated = Boolean(ci.transport);
                    }
                    else {
                        ci.transport = Lib.AP.VendorPortal.GetCITransport(fieldsToUpdate);
                        if (ci.transport) {
                            //try to update only existing CI
                            ci.updated = Lib.AP.VendorPortal.UpdateCI(ci.transport, fieldsToUpdate, null, parameters, true);
                            //Notify vendor in case of reject
                            if (VendorPortal.statusOnEnd === Lib.AP.InvoiceStatus.Rejected && ci.updated && !vendorNotified) {
                                NotifyVendorRejectedInvoice(ci.transport, parameters);
                            }
                        }
                    }
                }
                return ci;
            }
            VendorPortal.UpdateCIIfNeeded = UpdateCIIfNeeded;
            /**
            * Generate a CI from a CIData object
            */
            function CreateCIFromCIData(ciData, interactive) {
                var params = {
                    Invoice_number__: { "value": ciData.Invoice_number__, "type": "string" },
                    OrderNumber__: { "value": ciData.Order_number__, "type": "string" },
                    Net_amount__: { "value": ciData.Net_amount__, "type": "double" },
                    Invoice_amount__: { "value": ciData.Invoice_amount__, "type": "double" },
                    Invoice_date__: { "value": ciData.Invoice_date__, "type": "date" },
                    Currency__: { "value": ciData.Currency__, "type": "string" },
                    Due_date__: { "value": ciData.Due_date__, "type": "date" },
                    VendorNumber__: { "value": ciData.VendorNumber__, "type": "string" },
                    VendorContactEmail__: { "value": ciData.VendorContactEmail__, "type": "string" },
                    CompanyCode__: { "value": ciData.CompanyCode__, "type": "string" },
                    CustomerInvoiceStatus__: { "value": Lib.AP.CIStatus.Draft, "type": "string" },
                    Source_RuidEx__: { "value": Variable.GetValueAsString(Lib.AP.VendorPortal.FlipPO.VariableOrderRuidEx), "type": "string" },
                    FlipPO_RuidEx__: { "value": Data.GetValue("RuidEx"), "type": "string" }
                };
                var vendorUser = Lib.AP.VendorPortal.GetOrCreateVendor(ciData);
                if (!vendorUser) {
                    Log.Error("Cannot retrieve Customer invoice owner id, CI transport is not created");
                    return null;
                }
                var vendorUserVars = vendorUser.GetVars();
                var login = vendorUserVars.GetValue_String("login", 0);
                var CITransport = Process.CreateProcessInstanceForUser("Customer invoice", vendorUserVars.GetValue_String("login", 0), 0, true);
                addJSONAttachment(CITransport, ciData, "customerinvoice.json");
                var CIvars = CITransport.GetExternalVars();
                CIvars.AddValue_String("Mode", Lib.AP.CustomerInvoiceType.FlipPO, true);
                CIvars.AddValue_String("shortLogin", login, true);
                if (interactive) {
                    CITransport.GetVars(false).AddValue_Long("Priority", 1, true);
                }
                Lib.AP.VendorPortal.UpdateCI(CITransport, params);
                if (CITransport.GetLastError() === 0) {
                    return CITransport;
                }
                Log.Error("Cannot create CI transport " + CITransport.GetLastError());
                return null;
            }
            VendorPortal.CreateCIFromCIData = CreateCIFromCIData;
            /**
            * Fill parameters From to call ValidationScriptBegins and ValidationScriptEnds
            */
            function GetParametersFromDataInvoice(data, variable) {
                var parameters = {
                    VIRuidEx__: data.GetValue("RuidEx"),
                    Configuration__: data.GetValue("Configuration__"),
                    Invoice_number__: data.GetValue("InvoiceNumber__"),
                    Net_amount__: data.GetValue("NetAmount__"),
                    Invoice_amount__: data.GetValue("InvoiceAmount__"),
                    Invoice_date__: data.GetValue("InvoiceDate__"),
                    Currency__: data.GetValue("InvoiceCurrency__"),
                    Due_date__: data.GetValue("DueDate__"),
                    Invoice_status__: data.GetValue("InvoiceStatus__"),
                    portal_ruidex__: data.GetValue("PortalRuidex__"),
                    VendorNumber__: data.GetValue("VendorNumber__"),
                    VendorName__: data.GetValue("VendorName__"),
                    VendorContactEmail__: data.GetValue("VendorContactEmail__"),
                    CompanyCode__: data.GetValue("CompanyCode__"),
                    RejectReason__: data.GetValue("RejectReason__"),
                    PublishOnReject: variable ? Sys.Helpers.String.ToBoolean(variable.GetValueAsString("PublishOnReject")) : false,
                    CheckOwner: true,
                    FromUpdatePayment: false
                };
                // FT-025283 Dynamic discounting offer from vendor portal
                var isDynamicDiscountingAllowed = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.IsDynamicDiscountingAllowed");
                if (typeof isDynamicDiscountingAllowed !== "boolean") {
                    isDynamicDiscountingAllowed = Lib.AP.GetInvoiceDocument().IsDynamicDiscountingAllowed();
                }
                if (data.GetValue("PaymentTerms__")) {
                    var baseRateStr = Variable.GetValueAsString("PaymentTermDiscountRate");
                    var rate = parseFloat(baseRateStr.replace(",", ".")) || 0;
                    var dayLimitStr = Variable.GetValueAsString("PaymentTermDayLimit");
                    parameters.PaymentTermDiscountRate = rate;
                    parameters.PaymentTermDayLimit = parseInt(dayLimitStr, 10).toString() || null;
                    parameters.PaymentTermDescription = Variable.GetValueAsString("PaymentTermDescription");
                    if ((Lib.AP.isProviderCorpayEnabled() || isDynamicDiscountingAllowed) && Variable.GetValueAsString("EnableDynamicDiscounting") === "1") {
                        // Dynamic discount (the vendor can decide of a date to enable an early payment with discount)
                        parameters.PaymentTermEnableDynamicDiscounting = true;
                    }
                    else if (data.GetValue("EstimatedDiscountAmount__")) {
                        // Static discount
                        parameters.DiscountPercent__ = rate;
                        parameters.EstimatedDiscountAmount__ = data.GetValue("EstimatedDiscountAmount__");
                        parameters.DiscountLimitDate__ = data.GetValue("DiscountLimitDate__");
                    }
                }
                return parameters;
            }
            VendorPortal.GetParametersFromDataInvoice = GetParametersFromDataInvoice;
            /**
            * Fill parameters From to call ValidationScriptBegins and ValidationScriptEnds
            */
            function GetParametersFromDataPayment(values, paymentMethod, invoiceStatus) {
                var parameters = {
                    Configuration__: values.Configuration__,
                    PaymentReference__: values.PaymentReference__,
                    Payment_method__: paymentMethod,
                    PaymentDate__: values.PaymentDate__,
                    portal_ruidex__: values.RuidEx,
                    Invoice_status__: invoiceStatus,
                    InvoiceAmount__: values.Invoice_amount__,
                    VendorNumber__: values.VendorNumber__,
                    VendorName__: values.VendorName__,
                    CompanyCode__: values.CompanyCode__,
                    CheckOwner: false,
                    FromUpdatePayment: true
                };
                return parameters;
            }
            VendorPortal.GetParametersFromDataPayment = GetParametersFromDataPayment;
            /**
            * Trigger the begin of the validation scripts
            * Allows the lib to be able to know if we'll have to update the CI at the end of the validation script
            */
            function ValidationScriptBegins(parameters) {
                VendorPortal.statusOnBegin = parameters.Invoice_status__;
                VendorPortal.portalRuidex = parameters.portal_ruidex__;
                vendorNotified = false;
            }
            VendorPortal.ValidationScriptBegins = ValidationScriptBegins;
            /**
            * Trigger the end of the validation scripts
            * Allows the lib to be able to know if we'll have to update the CI at the end of the validation script
            */
            function ValidationScriptEnds(parameters) {
                VendorPortal.statusOnEnd = parameters.Invoice_status__;
                VendorPortal.publishOnReject = parameters.PublishOnReject;
                return UpdateCIIfNeeded(parameters);
            }
            VendorPortal.ValidationScriptEnds = ValidationScriptEnds;
            function GetOrCreateCompanyExtendedProperties(vendorNumber, companyCode) {
                if (!vendorNumber) {
                    Log.Warn("GetOrCreateCompanyExtendedProperties : No vendor number or companycode, cannot find extended company properties");
                    return null;
                }
                var table = "Vendor_company_extended_properties__";
                var filter;
                if (companyCode) {
                    filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber));
                }
                else {
                    filter = Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber);
                }
                var query = Process.CreateQueryAsProcessAdmin();
                query.SetSpecificTable(table);
                query.SetFilter(filter.toString());
                query.MoveFirst();
                var record = query.MoveNextRecord();
                if (!record) {
                    // No record, create one
                    record = Process.CreateTableRecord(table);
                    if (record) {
                        var vars = record.GetVars();
                        vars.AddValue_String("VendorNumber__", vendorNumber, true);
                        vars.AddValue_String("CompanyCode__", companyCode, true);
                        record.Commit();
                    }
                    else {
                        Log.Warn("GetOrCreateCompanyExtendedProperties : Cannot create new record");
                        return null;
                    }
                }
                return record;
            }
            VendorPortal.GetOrCreateCompanyExtendedProperties = GetOrCreateCompanyExtendedProperties;
            function ScheduledProposeEarlyPaymentOnVIP(vipsToUpdate, shortLogin) {
                function applyValuesOnVIP(discountInfo, vars, extVars) {
                    vars.AddValue_Date("DiscountLimitDate__", discountInfo.DiscountExpirationDate, true);
                    vars.AddValue_Double("EstimatedDiscountAmount__", discountInfo.DiscountAmount, true);
                    extVars.AddValue_Double("InvoiceAmountWithDiscount__", discountInfo.InvoiceAmountWithDiscount, true);
                    extVars.AddValue_Double("DiscountPercent__", discountInfo.DiscountRate, true);
                }
                var allInSuccess = false;
                var msnexs = Sys.Helpers.Array.Map(Array.from(vipsToUpdate.keys()), function (ruidex) { return ruidex.substring(ruidex.lastIndexOf(".") + 1); });
                if (!msnexs || msnexs.length === 0) {
                    Log.Error("ScheduledActionVIP: no VIRuidEx provided");
                }
                var filter = Sys.Helpers.LdapUtil.FilterIn("msnex", msnexs);
                var processQuery = Process.CreateQueryAsProcessAdmin();
                Log.Verbose("Request VIP with filter ".concat(filter.toString()));
                processQuery.Reset();
                processQuery.SetSearchInArchive(true);
                processQuery.SetSpecificTable("CDNAME#vendor invoice");
                processQuery.SetFilter(filter.toString());
                if (processQuery.MoveFirst()) {
                    allInSuccess = true;
                    var transport = processQuery.MoveNext();
                    while (transport) {
                        var vars = transport.GetUninheritedVars();
                        var extVars = transport.GetExternalVars();
                        var vipRuidex = vars.GetValue_String("RuidEx", 0);
                        var vipToUpdate = vipsToUpdate.get(vipRuidex);
                        if (vipToUpdate) {
                            Log.Verbose("Prepare to update VIP ".concat(vipRuidex));
                            // update record values
                            applyValuesOnVIP(vipToUpdate, vars, extVars);
                            // Call action
                            var scheduledAction = new Lib.CallScheduledAction.ScheduledAction();
                            scheduledAction.msnEx = vipRuidex;
                            scheduledAction.actionName = "proposeEarlyPayment";
                            scheduledAction.parameters = { shortLogin: shortLogin };
                            var isSuccess = Lib.CallScheduledAction.executeAction(vars, scheduledAction, transport, true);
                            if (!isSuccess) {
                                Log.Info("VIP state 100 - try to reopen it and call scheduled action again");
                                isSuccess = Lib.CallScheduledAction.executeAction(vars, scheduledAction, transport, true);
                            }
                            allInSuccess && (allInSuccess = isSuccess);
                        }
                        else {
                            Log.Error("VIP ".concat(vipRuidex, " not found"));
                        }
                        transport = processQuery.MoveNext();
                    }
                }
                return allInSuccess;
            }
            VendorPortal.ScheduledProposeEarlyPaymentOnVIP = ScheduledProposeEarlyPaymentOnVIP;
            /**
            * Specific namespace for the FlipPO feature
            */
            var FlipPO;
            (function (FlipPO) {
                /**
                * This variable will be used by the Flip PO process to convert a specific PO
                * if no CSV is provided
                */
                FlipPO.VariableOrderToConvert = "OrderToConvert";
                /**
                * Variable used to transmit the Order RuidEx to the customer invoice
                */
                FlipPO.VariableOrderRuidEx = "OrderRuidEx";
            })(FlipPO = VendorPortal.FlipPO || (VendorPortal.FlipPO = {}));
        })(VendorPortal = AP.VendorPortal || (AP.VendorPortal = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
