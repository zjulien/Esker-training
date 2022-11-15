///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Validation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Shipping library gathering the functions used during validation",
  "require": [
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_EmailNotification",
    "Sys/SYS_HELPERS_DATA",
    "Lib_P2P_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Shipping_InboundEmailProcessing_V12.0.461.0",
    "Lib_Shipping_PackingSlipGen_V12.0.461.0",
    "Lib_Shipping_Workflow_V12.0.461.0",
    "Lib_Shipping_Workflow_Server_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Validation;
        (function (Validation) {
            var libScoring = Lib.AP && Lib.AP.Scoring;
            function SendNotificationToReviewer(reviewerLogin) {
                Log.Info("[Validation.SendNotificationToReviewer] with reviewerLogin: ".concat(reviewerLogin));
                var toUser = Users.GetUserAsProcessAdmin(reviewerLogin);
                var template = "Purchasing_Email_NotifASNReviewer_XX.htm";
                var fromUser = Lib.P2P.GetValidatorOrOwner();
                var fromName = Data.GetValue("VendorName__") || fromUser.GetValue("DisplayName");
                var accountLogo = fromUser.GetLogoPath();
                var customTags = {
                    AccountLogo: accountLogo
                };
                var options = {
                    backupUserAsCC: true,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
            }
            Validation.SendNotificationToReviewer = SendNotificationToReviewer;
            function SendErrorNotificationToUser(userLogin) {
                Log.Info("[Validation.SendErrorNotificationToUser]");
                var toUser = Users.GetUserAsProcessAdmin(userLogin);
                var template = "Purchasing_Email_NotifASNError_XX.htm";
                var fromName = "_EskerASN";
                var customTags = {};
                var options = {
                    backupUserAsCC: true,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
            }
            Validation.SendErrorNotificationToUser = SendErrorNotificationToUser;
            function ForwardToReviewer(reviewerLogin) {
                Log.Info("[Validation.ForwardToReviewer] with reviewerLogin: ".concat(reviewerLogin));
                Process.Forward(reviewerLogin);
            }
            Validation.ForwardToReviewer = ForwardToReviewer;
            /// EXPORTS
            function AddReviewStep(isInError) {
                if (isInError === void 0) { isInError = false; }
                Log.Info("[Validation.AddReviewStep]");
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    Data.SetValue("Status__", "Draft");
                    var reviewerLogin = Lib.Shipping.Workflow.GetReviewerLogin();
                    Log.Info("[Validation.AddReviewStep] reviewer: " + reviewerLogin);
                    if (isInError) {
                        Lib.Shipping.Validation.SendErrorNotificationToUser(reviewerLogin);
                    }
                    else {
                        Lib.Shipping.Validation.SendNotificationToReviewer(reviewerLogin);
                    }
                    Lib.Shipping.Validation.ForwardToReviewer(reviewerLogin);
                })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("Validation.AddReviewStep"));
            }
            Validation.AddReviewStep = AddReviewStep;
            var ValidationOptions = /** @class */ (function () {
                function ValidationOptions() {
                    // always add reviewer even if touchless possible
                    // if false, a reviewer will be added if anything prevents touchless
                    this.addReviewer = false;
                    // generate PDF packing slip
                    this.generatePDFFromData = false;
                    // set cxml document as technical
                    this.setFirstAttachmentAsTechnical = false;
                    this.rejectASN = false;
                    this.submitASN = false;
                }
                return ValidationOptions;
            }());
            Validation.ValidationOptions = ValidationOptions;
            var ASNProcessOrigin;
            (function (ASNProcessOrigin) {
                ASNProcessOrigin["Portal"] = "Portal";
                ASNProcessOrigin["ISM"] = "ISM";
                ASNProcessOrigin["Reprocess"] = "Reprocess";
                ASNProcessOrigin["Other"] = "Other";
            })(ASNProcessOrigin = Validation.ASNProcessOrigin || (Validation.ASNProcessOrigin = {}));
            var ASNAttachementFileType;
            (function (ASNAttachementFileType) {
                ASNAttachementFileType["cXML"] = "cXML";
                ASNAttachementFileType["PDF"] = "PDF";
                ASNAttachementFileType["Other"] = "Other";
            })(ASNAttachementFileType = Validation.ASNAttachementFileType || (Validation.ASNAttachementFileType = {}));
            var FormattedDateOptions = {
                dateFormat: "ShortDate",
                timeFormat: "None",
                timeZone: "User"
            };
            function GetFormattedDateFromField(fieldName, user) {
                var date = Data.GetValue(fieldName);
                return user && date ? user.GetFormattedDate(date, FormattedDateOptions) : null;
            }
            Validation.GetFormattedDateFromField = GetFormattedDateFromField;
            function GetTrackingLink() {
                var trackingNumber = Data.GetValue("TrackingNumber__");
                var carrier = Data.GetValue("CarrierCombo__");
                if (trackingNumber && carrier && carrier !== "Other") {
                    return Lib.Shipping.GetCarrierLink(carrier, trackingNumber);
                }
                return null;
            }
            Validation.GetTrackingLink = GetTrackingLink;
            function SendNotificationToRecipient(toUserID) {
                var toUser = Users.GetUserAsProcessAdmin(toUserID);
                var template = "Purchasing_Email_NotifReceiver_ASNSubmitted_XX.htm";
                var fromUser = Users.GetUser(Variable.GetValueAsString("VendorLogin"));
                var fromName = fromUser.GetValue("DisplayName") || Data.GetValue("VendorName__");
                var shippingDate = Lib.Shipping.Validation.GetFormattedDateFromField("ShippingDate__", toUser);
                var expectedDeliveryDate = Lib.Shipping.Validation.GetFormattedDateFromField("ExpectedDeliveryDate__", toUser);
                var carrier = Data.GetValue("Carrier__");
                var trackingNumber = Data.GetValue("TrackingNumber__");
                var trackingLink = GetTrackingLink();
                var VendorName = Data.GetValue("VendorName__");
                var customTags = {
                    VendorName: VendorName,
                    RecipientDisplayName: toUser.GetValue("DisplayName"),
                    shippingDate: shippingDate,
                    expectedDeliveryDate: expectedDeliveryDate,
                    carrier: carrier,
                    trackingNumber: trackingNumber,
                    trackingLink: trackingLink,
                    isShippingDateDefined: !Sys.Helpers.IsEmpty(shippingDate),
                    isExpectedDeliveryDateDefined: !Sys.Helpers.IsEmpty(expectedDeliveryDate),
                    isCarrierDefined: !Sys.Helpers.IsEmpty(carrier),
                    isTrackingNumberDefined: !Sys.Helpers.IsEmpty(trackingNumber),
                    isTrackingLinkDefined: !Sys.Helpers.IsEmpty(trackingLink)
                };
                var options = {
                    backupUserAsCC: true,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
            }
            Validation.SendNotificationToRecipient = SendNotificationToRecipient;
            function RejectASN() {
                Log.Error("[Shipping.RejectASN]");
                Data.SetValue("State", "400");
                Data.SetValue("Status__", "Rejected");
            }
            Validation.RejectASN = RejectASN;
            function RemoveItemsWithoutQuantity() {
                var lineItemTable = Data.GetTable("LineItems__");
                // Remove service lines without quantity
                for (var index = lineItemTable.GetItemCount() - 1; index >= 0; index--) {
                    var curItem = lineItemTable.GetItem(index);
                    var note = curItem.GetValue("ItemNote__");
                    if (!curItem.GetValue("ItemQuantity__") && !(note === null || note === void 0 ? void 0 : note.replace(/[ \t\r\n]/g, "").length)) {
                        curItem.RemoveItem();
                    }
                }
            }
            Validation.RemoveItemsWithoutQuantity = RemoveItemsWithoutQuantity;
            function SendNotificationsToRecipients() {
                var recipients = Lib.Shipping.GetRecipients();
                Sys.Helpers.Array.ForEach(recipients, function (recipient) {
                    Lib.Shipping.Validation.SendNotificationToRecipient(recipient);
                });
            }
            Validation.SendNotificationsToRecipients = SendNotificationsToRecipients;
            function SubmitASNImpl(options) {
                options = options || {};
                Log.Info("[Validation.SubmitASNImpl] options: ".concat(JSON.stringify(options)));
                var lineItemTable = Data.GetTable("LineItems__");
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    Data.SetValue("Status__", "Submitted");
                    Lib.Shipping.Validation.RemoveItemsWithoutQuantity();
                })
                    .Then(function () {
                    if (options.reAttachPackingSlip) {
                        return Lib.Shipping.PackingSlipGen.ReAttachPackingSlip();
                    }
                    return Sys.Helpers.Promise.Resolve();
                })
                    .Then(function () {
                    /** NOTIF */
                    Lib.Shipping.Validation.SendNotificationsToRecipients();
                    var firstItem = lineItemTable.GetItem(0);
                    var firstRecipientID = firstItem.GetValue("ItemPORecipientDN__");
                    Process.SaveAutolearningData();
                    if (options.isTouchless) {
                        Lib.Shipping.Workflow.Init();
                        Lib.Shipping.Workflow.SetStartingDateAndRight();
                    }
                    if (options.forwardProcess) {
                        Lib.Shipping.Workflow.Init();
                        Lib.Shipping.Workflow.ForwardToRecipient(firstRecipientID);
                    }
                })
                    .Catch(function (reason) {
                    if (options.isTouchless) {
                        Lib.Shipping.Workflow.Init(true);
                        Lib.Shipping.Workflow.SetStartingDateAndRight();
                    }
                    if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                        Log.Error("[Validation.SubmitASNImpl] unexpected error: ".concat(reason));
                    }
                    return false;
                });
            }
            Validation.SubmitASNImpl = SubmitASNImpl;
            function GetProcessOrigin() {
                Log.Info("[Validation.GetProcessOrigin]");
                var currentAction = Data.GetActionType();
                var sourceType = Data.GetValue("ASNSourceType__");
                var isFromInboundEmail = Lib.Shipping.InboundEmailProcessing.IsCreatedFromInboundEmail();
                Log.Verbose("[Validation.GetProcessOrigin] current action : ".concat(currentAction));
                Log.Verbose("[Validation.GetProcessOrigin] sourceType : ".concat(sourceType));
                Log.Verbose("[Validation.GetProcessOrigin] isFromInboundEmail : ".concat(isFromInboundEmail));
                if (sourceType === "Portal") {
                    return ASNProcessOrigin.Portal;
                }
                else if (isFromInboundEmail) {
                    return ASNProcessOrigin.ISM;
                }
                else if (currentAction === "reprocess" || currentAction === "autocomplete") {
                    return ASNProcessOrigin.Reprocess;
                }
                Log.Verbose("[Validation.GetProcessOrigin] No origin detected, setting origin to 'Other'");
                return ASNProcessOrigin.Other;
            }
            Validation.GetProcessOrigin = GetProcessOrigin;
            function GetAttachementFileType() {
                Log.Info("[Validation.GetAttachementFileType]");
                if (Attach.GetNbAttach() > 0) {
                    var extension = Attach.GetExtension(0).toLowerCase();
                    Log.Verbose("[Validation.GetAttachementFileType] File type: ".concat(extension, " "));
                    if (extension === ".xml") {
                        return ASNAttachementFileType.cXML;
                    }
                    else if (extension === ".pdf") {
                        return ASNAttachementFileType.PDF;
                    }
                }
                Log.Verbose("[Validation.GetAttachementFileType] No attachment, setting file type to 'Other'");
                return ASNAttachementFileType.Other;
            }
            Validation.GetAttachementFileType = GetAttachementFileType;
            function ComputeValidationOptions(processOrigin, attachementFileType) {
                Log.Info("[Validation.ComputeValidationOptions] with processOrigin: ".concat(processOrigin, " and attachementFileType: ").concat(attachementFileType));
                var options = new ValidationOptions();
                if (attachementFileType === ASNAttachementFileType.cXML) {
                    options.generatePDFFromData = true;
                    options.setFirstAttachmentAsTechnical = true;
                    if (processOrigin === ASNProcessOrigin.ISM || processOrigin === ASNProcessOrigin.Other) {
                        options.submitASN = true;
                    }
                }
                else if (attachementFileType === ASNAttachementFileType.PDF) {
                    if (processOrigin === ASNProcessOrigin.ISM || processOrigin === ASNProcessOrigin.Other) {
                        options.addReviewer = true;
                    }
                }
                else if (attachementFileType === ASNAttachementFileType.Other) {
                    if (processOrigin === ASNProcessOrigin.Portal) {
                        options.generatePDFFromData = true;
                    }
                    else {
                        Log.Error("[Validation.ComputeValidationOptions] Cannot create ASN without a cXML or PDF attachment outside portal");
                        options.rejectASN = true;
                    }
                }
                Log.Verbose("[Validation.ComputeValidationOptions] with processOrigin: ".concat(JSON.stringify(options), ")"));
                return options;
            }
            Validation.ComputeValidationOptions = ComputeValidationOptions;
            function SendDeliveryNotification(toUserID, isPartiallyReceived, redirectionAddress) {
                Log.Info("[Validation.SendDeliveryNotification] with toUserID: ".concat(toUserID, ", isPartiallyReceived: ").concat(isPartiallyReceived, ", redirectionAddress: ").concat(redirectionAddress));
                var toUser = Users.GetUserAsProcessAdmin(toUserID);
                var template = "Purchasing_Email_NotifSupplier_ASNDelivery_V2_XX.htm";
                var fromUser = Lib.P2P.GetValidatorOrOwner();
                var fromName = fromUser.GetValue("DisplayName");
                var carrier = Data.GetValue("Carrier__");
                var trackingNumber = Data.GetValue("TrackingNumber__");
                var trackingLink = Lib.Shipping.Validation.GetTrackingLink();
                var deliveryDate = Lib.Shipping.Validation.GetFormattedDateFromField("ASNDeliveryDate__", toUser);
                var AccountLogo;
                if (fromUser) {
                    AccountLogo = fromUser.GetLogoPath();
                }
                else {
                    Log.Error("Cannot retrieve owner or validator");
                }
                var customTags = {
                    AccountLogo: AccountLogo,
                    RecipientDisplayName: toUser.GetValue("DisplayName"),
                    ShipToCompany: Sys.TechnicalData.GetValue("ShipToCompany"),
                    carrier: carrier,
                    trackingNumber: trackingNumber,
                    trackingLink: trackingLink,
                    deliveryDate: deliveryDate,
                    isCarrierDefined: !Sys.Helpers.IsEmpty(carrier),
                    isTrackingNumberDefined: !Sys.Helpers.IsEmpty(trackingNumber),
                    isTrackingLinkDefined: !Sys.Helpers.IsEmpty(trackingLink),
                    isPartiallyReceived: isPartiallyReceived,
                    validationURL: toUser.GetProcessURL(Data.GetValue("VendorASNRUIDEX__"), false)
                };
                var options = {
                    backupUserAsCC: true,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1",
                    emailAddress: redirectionAddress
                };
                Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
            }
            Validation.SendDeliveryNotification = SendDeliveryNotification;
            function PublishReviewScoring() {
                Log.Info("[Validation.PublishReviewScoring]");
                var scoring = Data.GetValue("ScoringValue__");
                if (scoring > 0) {
                    libScoring.AddScoreValue(Variable.GetValueAsString("CompanyCode__"), Variable.GetValueAsString("VendorNumber__"), libScoring.ScoreTypes.Delivery, scoring, Data.GetValue("ScoringComment__"));
                }
            }
            Validation.PublishReviewScoring = PublishReviewScoring;
            function CreateGR(orderNumber) {
                try {
                    var items = Lib.Shipping.GetPOItemsForPO(orderNumber, Lib.P2P.GetValidator());
                    var firstItem = items[0];
                    Log.Info("Generating Goods receipt for ASN");
                    if (CountTotalReceivedQty(items) > 0) {
                        var childCD = Process.CreateProcessInstanceForUser(Lib.P2P.GetGRProcessName(), firstItem.GetValue("ItemPORecipientDN__"), 2 /* ChildProcessType.Notification */, true);
                        if (childCD) {
                            var autoCompleteFromASNData_1 = {
                                "ItemPORecipientDN__": firstItem.GetValue("ItemPORecipientDN__"),
                                "SourcePONumber": firstItem.GetValue("ItemPONumber__"),
                                "DeliveryNote": Data.GetValue("ASNNumber__"),
                                "DeliveryDate": Data.GetValue("ASNDeliveryDate__"),
                                "ASNNumber": Data.GetValue("ASNNumber__"),
                                items: []
                            };
                            Sys.Helpers.Array.ForEach(items, function (item) {
                                var dataItem = {
                                    "ItemQuantity__": item.GetValue("ItemQuantity__"),
                                    "ReceivedQuantity__": item.GetValue("ItemQuantityReceived__"),
                                    "ItemPOLineNumber__": item.GetValue("ItemPOLineNumber__"),
                                    "ItemNote__": item.GetValue("ItemNote__")
                                };
                                autoCompleteFromASNData_1.items.push(dataItem);
                            });
                            var vars = childCD.GetUninheritedVars();
                            vars.AddValue_String("TechnicalData__", JSON.stringify({ autoCompleteFromASNData: autoCompleteFromASNData_1 }), true);
                            var externalVars = childCD.GetExternalVars();
                            externalVars.AddValue_String("OrderNumber__", firstItem.GetValue("ItemPONumber__"), true);
                            externalVars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
                            childCD.Process();
                            return vars.GetValue_String("RUIDEX", 0);
                        }
                    }
                    Log.Error("Could not create the next process");
                    throw "Could not create the next process";
                }
                catch (e) {
                    Log.Info("Goods receipt does not exist");
                }
                return "";
            }
            Validation.CreateGR = CreateGR;
            function CountTotalReceivedQty(items) {
                var total_quantity = 0;
                items.forEach(function (it) {
                    total_quantity = total_quantity + it.GetValue("ItemQuantityReceived__");
                });
                return total_quantity;
            }
            function RemoveErrors() {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    item.SetError("ItemPONumber__", "");
                    item.SetError("ItemPOLineNumber__", "");
                });
            }
            function ValidateExtraction() {
                var processOrigin = Lib.Shipping.Validation.GetProcessOrigin();
                var attachementFileType = Lib.Shipping.Validation.GetAttachementFileType();
                var options = Lib.Shipping.Validation.ComputeValidationOptions(processOrigin, attachementFileType);
                Log.Info("[Validation.ValidateExtraction] with validationOptions: ".concat(JSON.stringify(options)));
                var bFormCompletedTouchless = false;
                var promise = Sys.Helpers.Promise.Resolve();
                var shouldSendErrorNotif = false;
                if (options.rejectASN) {
                    promise = promise.Then(RejectASN);
                }
                promise = promise.Then(Lib.Shipping.TryToCompleteFormWithOrderData).Then(function (isOk) {
                    if (processOrigin === Lib.Shipping.Validation.ASNProcessOrigin.Portal) {
                        RemoveErrors();
                    }
                    bFormCompletedTouchless = isOk && !Data.FormHasError();
                    Log.Info("[Validation.ValidateExtraction] TryToCompleteFormWithOrderData result ".concat(bFormCompletedTouchless));
                    if (!bFormCompletedTouchless
                        && processOrigin === Lib.Shipping.Validation.ASNProcessOrigin.ISM
                        && attachementFileType === Lib.Shipping.Validation.ASNAttachementFileType.cXML) {
                        shouldSendErrorNotif = true;
                    }
                });
                promise = promise.Then(Lib.Shipping.InitDefaultCompanyCode);
                promise = promise.Then(function () {
                    return Lib.Shipping.Workflow.Init(options.addReviewer || shouldSendErrorNotif);
                });
                if (options.addReviewer || shouldSendErrorNotif) {
                    promise = promise.Then(function () {
                        return Lib.Shipping.Validation.AddReviewStep(shouldSendErrorNotif);
                    });
                }
                promise = promise.Then(function () {
                    Lib.Shipping.Workflow.SetStartingDateAndRight(null, !options.addReviewer);
                });
                if (options.setFirstAttachmentAsTechnical) {
                    promise = promise.Then(function () {
                        Attach.SetValue(0, "AttachToProcess", 0);
                        Attach.SetTechnical(0, true);
                    });
                }
                if (options.generatePDFFromData) {
                    Sys.TechnicalData.SetValue("GeneratedPDFFromData", "1");
                    promise = promise.Then(Lib.Shipping.PackingSlipGen.AttachPackingSlip);
                }
                if (options.submitASN) {
                    promise = promise.Then(function () {
                        if (bFormCompletedTouchless) {
                            var submitOpts = {
                                isTouchless: true,
                                forwardProcess: true,
                                reAttachPackingSlip: options.generatePDFFromData
                            };
                            return Lib.Shipping.Validation.SubmitASNImpl(submitOpts);
                        }
                        return Sys.Helpers.Promise.Resolve();
                    });
                }
                promise
                    .Catch(HandleValidationError)
                    .Finally(function () { return Process.PreventApproval(); });
                return promise;
            }
            Validation.ValidateExtraction = ValidateExtraction;
            function HandleValidationError(reason) {
                if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                    Log.Error("[Validation.ValidateExtraction] unexpected error: " + reason);
                }
                Lib.CommonDialog.NextAlert.Define("_ValidateExtraction_ErrorTitle", "_ValidateExtraction_ErrorMessage", {
                    isError: true
                });
            }
            Validation.HandleValidationError = HandleValidationError;
            function SubmitASN(opts) {
                var options = opts || {};
                if (options.lastReviewer === false) {
                    var workflow = Lib.Shipping.Workflow.controller;
                    var nextContributor = workflow.GetContributorAt(workflow.GetContributorIndex() + 1);
                    if (nextContributor) {
                        Lib.Shipping.Validation.SendNotificationToReviewer(nextContributor.login);
                    }
                    // If explicitly set to false, nothing to do yet as there are other reviewers
                    return Sys.Helpers.Promise.Resolve();
                }
                // No reviewer (undefined) or last reviewer (true): update state and go in Pending receipt state (and lot of stuff)
                options.reAttachPackingSlip = Sys.Helpers.Data.IsTrue(Sys.TechnicalData.GetValue("GeneratedPDFFromData"));
                Log.Info("[Validation.SubmitASN]");
                return Lib.Shipping.Validation.SubmitASNImpl(options);
            }
            Validation.SubmitASN = SubmitASN;
            function LastReception() {
                var isPartiallyReceived = Lib.Shipping.IsPartiallyReceived();
                // Update status when last receiver has received
                Data.SetValue("Status__", isPartiallyReceived ? "Partially Received" : "Received");
                var notifNeeded = Data.GetValue("ASNSourceType__") === "Portal";
                if (notifNeeded) {
                    // Send notif when last receiver has received
                    var toUserID = Variable.GetValueAsString("VendorLogin");
                    var redirectionAddress = Lib.P2P.computeVendorEmailRedirection();
                    Lib.Shipping.Validation.SendDeliveryNotification(toUserID, isPartiallyReceived, redirectionAddress);
                }
            }
            Validation.LastReception = LastReception;
            /**
             * Returns all items in PO
             * @returns {object} items map by PO number
             */
            function GetPOItemsInForm() {
                var allPOItems = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var poNumber = line.GetValue("ItemPONumber__");
                    if (!(poNumber in allPOItems)) {
                        allPOItems[poNumber] = [];
                    }
                    allPOItems[poNumber].push(line);
                });
                return allPOItems;
            }
            function CheckOverReception() {
                var allPOItems = GetPOItemsInForm();
                return Lib.Purchasing.Items.CheckOverReceivedItems(allPOItems, null, "ASN" /* Lib.Purchasing.Items.ItemType.ASN */);
            }
            Validation.CheckOverReception = CheckOverReception;
            Validation.OverReceivedItemError = function () { };
            function ConfirmReceipt() {
                Log.Info("[Validation.ConfirmReceipt]");
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    if (!Lib.Shipping.Validation.CheckOverReception()) {
                        Log.Info("Reception blocked because an item has been over-received");
                        // Over-received, throw exception
                        throw new Validation.OverReceivedItemError();
                    }
                })
                    .Then(function () {
                    if (libScoring) {
                        Lib.Shipping.Validation.PublishReviewScoring();
                    }
                    var orderNumbers = Lib.Shipping.GetOrderNumbers();
                    Sys.Helpers.Object.ForEach(orderNumbers, function (orderNumber) { return Lib.Shipping.Validation.CreateGR(orderNumber); });
                });
                // Errors are caught at the upper level
            }
            Validation.ConfirmReceipt = ConfirmReceipt;
            function PrepareDownloadablePreviewRPTDataFile() {
                Log.Info("[PrepareDownloadablePreviewRPTDataFile]");
                Lib.Shipping.PackingSlipGen.GeneratePackingSlipJson()
                    .Then(function (dataJSON) {
                    Log.Info("[PrepareDownloadablePreviewRPTDataFile] got json");
                    Variable.SetValueAsString("DownloadablePreviewDataJSON", dataJSON);
                })
                    .Catch(function (reason) {
                    if (!(reason instanceof Lib.Shipping.PackingSlipGen.PackingSlipGenError)) {
                        Log.Error("[PrepareDownloadablePreviewRPTDataFile] unexpected error: ".concat(reason));
                    }
                    Variable.SetValueAsString("DownloadablePreviewDataJSON", "");
                    Lib.CommonDialog.NextAlert.Define("_DownloadPreviewRPTDataFile_ErrorTitle", "_DownloadPreviewRPTDataFile_ErrorMessage", {
                        isError: true,
                        behaviorName: "PrepareDownloadablePreviewRPTDataFileError"
                    });
                })
                    .Then(function () {
                    Process.PreventApproval();
                });
            }
            Validation.PrepareDownloadablePreviewRPTDataFile = PrepareDownloadablePreviewRPTDataFile;
        })(Validation = Shipping.Validation || (Shipping.Validation = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
