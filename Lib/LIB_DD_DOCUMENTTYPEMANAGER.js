/* LIB_DEFINITION{
  "name": "LIB_DD_DOCUMENTTYPEMANAGER",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "DD document type manager",
  "require": [
    "Lib_DD_Common_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var DocumentTypeManager;
        (function (DocumentTypeManager) {
            DocumentTypeManager.AddNewDocumentTypeOption = Language.Translate("_NewDocumentType");
            DocumentTypeManager._existingDocumentTypes = null;
            DocumentTypeManager._oldDocumentType = null;
            DocumentTypeManager._configurationFoundAtStart = null;
            DocumentTypeManager._documentTypeControl = null;
            DocumentTypeManager._documentTypeAutolearnControl = null;
            DocumentTypeManager._documentTypeChangedCallback = null;
            DocumentTypeManager._canAddNewDocumentType = null;
            DocumentTypeManager._excludedDocType = null;
            DocumentTypeManager.AddNewFamilyOption = Language.Translate("_NewDocumentType");
            DocumentTypeManager._existingDBFamilies = null;
            DocumentTypeManager._familyControl = null;
            DocumentTypeManager._oldFamily = null;
            DocumentTypeManager.previousFamilyOnChangeCallback = null;
            function TU_EmptyConfiguration() {
                Lib.DD.DocumentTypeManager._existingDocumentTypes = null;
            }
            DocumentTypeManager.TU_EmptyConfiguration = TU_EmptyConfiguration;
            function CheckRequired() {
                if (DocumentTypeManager._documentTypeControl.IsReadOnly()) {
                    DocumentTypeManager._documentTypeControl.SetRequired(false);
                }
            }
            DocumentTypeManager.CheckRequired = CheckRequired;
            function Init(documentTypeControl, documentTypeAutolearnControl, configurationNameAtStart, documentTypeChangedCallback, canAddNewDocumentType, excludedDocType) {
                DocumentTypeManager._configurationFoundAtStart = configurationNameAtStart;
                DocumentTypeManager._documentTypeControl = documentTypeControl;
                DocumentTypeManager._documentTypeAutolearnControl = documentTypeAutolearnControl;
                DocumentTypeManager._documentTypeChangedCallback = documentTypeChangedCallback;
                DocumentTypeManager._canAddNewDocumentType = canAddNewDocumentType;
                DocumentTypeManager._excludedDocType = excludedDocType;
            }
            DocumentTypeManager.Init = Init;
            function CanAddNewDocumentType() {
                if (Variable.GetValueAsString("SDADocumentFamily")) {
                    return false;
                }
                else if (DocumentTypeManager._canAddNewDocumentType != null) {
                    return DocumentTypeManager._canAddNewDocumentType;
                }
                return User.IsBusinessRoleEnabled("DocumentTypeCreator");
            }
            DocumentTypeManager.CanAddNewDocumentType = CanAddNewDocumentType;
            function CheckDocumentTypes(that, documentTypes, predictedDocumentType) {
                var predictedDocumentTypeAllowed = false;
                if (that._existingDocumentTypes) {
                    var allowedDocumentTypeCount = 0;
                    var predictedDocumentTypeToLowerCase = (predictedDocumentType || "").toLowerCase();
                    for (var documentType in that._existingDocumentTypes) {
                        if (that._excludedDocType && that._excludedDocType.indexOf(documentType) > -1) {
                            continue;
                        }
                        documentTypes.push(documentType);
                        if (documentType.toLowerCase() === predictedDocumentTypeToLowerCase) {
                            predictedDocumentTypeAllowed = true;
                        }
                        allowedDocumentTypeCount++;
                    }
                    if (allowedDocumentTypeCount === 0 && Variable.GetValueAsString("SDADocumentFamily")) {
                        Log.Warn("Forced document family does not exist: " + Variable.GetValueAsString("SDADocumentFamily"));
                    }
                }
                return predictedDocumentTypeAllowed;
            }
            DocumentTypeManager.CheckDocumentTypes = CheckDocumentTypes;
            function CheckPredictedDocumentTypeCompatibility(documentTypes, predictedDocumentType, predictedDocumentTypeAllowed, blankDocumentTypeAllowed) {
                if (Variable.GetValueAsString("SDADocumentFamily") && !predictedDocumentTypeAllowed) {
                    if (predictedDocumentType) {
                        Log.Warn("Predicted document type (" + predictedDocumentType + ") is not compatible with the forced document family: " + Variable.GetValueAsString("SDADocumentFamily"));
                    }
                    Data.SetValue("Document_Type__", "");
                    if (!blankDocumentTypeAllowed) {
                        documentTypes.unshift("");
                    }
                }
            }
            DocumentTypeManager.CheckPredictedDocumentTypeCompatibility = CheckPredictedDocumentTypeCompatibility;
            function CheckTemporaryDocumentType(documentTypes) {
                var temporaryDocumentType = null;
                if (!Variable.GetValueAsString("SDADocumentFamily")) {
                    temporaryDocumentType = Variable.GetValueAsString("TemporaryDocumentType");
                    if (temporaryDocumentType) {
                        var matchingDocumentType = documentTypes.filter(function (documentTypeValue) {
                            return temporaryDocumentType.toLowerCase() === documentTypeValue.toLowerCase();
                        });
                        if (matchingDocumentType.length === 0) {
                            documentTypes.push(temporaryDocumentType);
                        }
                    }
                }
                return temporaryDocumentType;
            }
            DocumentTypeManager.CheckTemporaryDocumentType = CheckTemporaryDocumentType;
            function ComputeDocumentTypeList() {
                var that = this;
                if (ProcessInstance.state > 70) {
                    var value = that._documentTypeControl.GetValue();
                    if (value) {
                        that._documentTypeControl.SetAvailableValues([value + "=" + value]);
                    }
                    return;
                }
                var blankDocumentTypeAllowed = false;
                var predictedDocumentType = Data.GetValue("Document_Type__");
                var documentTypes = [];
                if (!that._configurationFoundAtStart) {
                    documentTypes.push("");
                    blankDocumentTypeAllowed = true;
                }
                var predictedDocumentTypeAllowed = Lib.DD.DocumentTypeManager.CheckDocumentTypes(that, documentTypes, predictedDocumentType);
                Lib.DD.DocumentTypeManager.CheckPredictedDocumentTypeCompatibility(documentTypes, predictedDocumentType, predictedDocumentTypeAllowed, blankDocumentTypeAllowed);
                var temporaryDocumentType = Lib.DD.DocumentTypeManager.CheckTemporaryDocumentType(documentTypes);
                if (that.CanAddNewDocumentType()) {
                    documentTypes.push(that.AddNewDocumentTypeOption);
                }
                for (var i = 0; i < documentTypes.length; i++) {
                    documentTypes[i] += "=" + documentTypes[i];
                }
                that._documentTypeControl.SetAvailableValues(documentTypes);
                if (!that.previousOnChangeCallback && that._documentTypeControl.OnChange) {
                    that.previousOnChangeCallback = that._documentTypeControl.OnChange;
                }
                that._documentTypeControl.OnChange = function () {
                    if (that.previousOnChangeCallback) {
                        that.previousOnChangeCallback.apply(that, arguments);
                    }
                    that.HandleDocumentTypeChange();
                };
                if (temporaryDocumentType) {
                    var selectDocumentType = Lib.DD.DocumentTypeManager.GetAvailableDocumentType(temporaryDocumentType);
                    that.SetDocumentType(selectDocumentType);
                }
            }
            DocumentTypeManager.ComputeDocumentTypeList = ComputeDocumentTypeList;
            function GetDefaultFieldsOrder() {
                var defaultFieldsOrder = ["Document_ID__", "Document_type__"];
                defaultFieldsOrder = defaultFieldsOrder.concat(GetRoutingFieldsNames(), ["Comment__", "Document_type_autolearn__", "Enable_touchless__"]);
                return defaultFieldsOrder;
            }
            DocumentTypeManager.GetDefaultFieldsOrder = GetDefaultFieldsOrder;
            function GetRoutingFieldsNames() {
                return [
                    "Delivery_method__",
                    "ProcessRelatedConfiguration__",
                    "Recipient_email__",
                    "Recipient_address__",
                    "Recipient_fax__",
                    "Recipient_ID__",
                    "Recipient_ID_link__",
                    "FormRelatedToConversationMsnex__"
                ];
            }
            DocumentTypeManager.GetRoutingFieldsNames = GetRoutingFieldsNames;
            function ProcessFieldsOrderFromConf(fieldsOrder) {
                var defaultSystemFieldsOrder = Lib.DD.DocumentTypeManager.GetDefaultFieldsOrder();
                if (!fieldsOrder) {
                    return defaultSystemFieldsOrder;
                }
                try {
                    var specificDocTypeOrder = JSON.parse(fieldsOrder);
                    if (specificDocTypeOrder.length > 0) {
                        var routingFields = Lib.DD.DocumentTypeManager.GetRoutingFieldsNames();
                        var indexOfRoutingBlock = specificDocTypeOrder.indexOf("Routing_fields__");
                        if (indexOfRoutingBlock > -1) {
                            var preRoutingBlockFields = specificDocTypeOrder.slice(0, indexOfRoutingBlock);
                            var postRoutingBlockFields = specificDocTypeOrder.slice(indexOfRoutingBlock + 1);
                            return preRoutingBlockFields.concat(routingFields).concat(postRoutingBlockFields);
                        }
                        return specificDocTypeOrder;
                    }
                }
                catch (err) {
                    Log.Error("Missing fields order, applying default fields order");
                }
                return defaultSystemFieldsOrder;
            }
            DocumentTypeManager.ProcessFieldsOrderFromConf = ProcessFieldsOrderFromConf;
            function RetrieveExistingAutoLearningDocumentTypes(callback, includeDisabledConfigurations) {
                function CallBackGetConfiguration() {
                    var err = this.GetQueryError();
                    if (err) {
                        Popup.Alert(err);
                        return;
                    }
                    Lib.DD.DocumentTypeManager._existingDocumentTypes = {};
                    for (var i = 0; i < this.GetRecordsCount(); i++) {
                        var configuration = {};
                        var documentType = this.GetQueryValue("Document_Type__", i);
                        configuration.configurationName = this.GetQueryValue("ConfigurationName__", i);
                        configuration.isAutoLearning = this.GetQueryValue("MatchDocumentLayout__", i) === "1" && this.GetQueryValue("ConfigurationSelection_Enable__", i) === "1";
                        configuration.family = this.GetQueryValue("Family__", i) || null;
                        configuration.fieldsOrder = Lib.DD.DocumentTypeManager.ProcessFieldsOrderFromConf(this.GetQueryValue("FieldsOrder__", i));
                        configuration.routing = this.GetQueryValue("Routing__", i) || null;
                        configuration.defaultDelivery = this.GetQueryValue("DefaultDelivery__", i) || null;
                        configuration.isCOPRoutingAllowed = this.GetQueryValue("IsCOPAllowed__", i) || true;
                        configuration.isEmailRoutingAllowed = this.GetQueryValue("IsEmailAllowed__", i) || true;
                        configuration.isArchiveRoutingAllowed = this.GetQueryValue("IsArchiveAllowed__", i) || true;
                        configuration.isMODRoutingAllowed = this.GetQueryValue("IsMODAllowed__", i) || true;
                        configuration.isPortalRoutingAllowed = this.GetQueryValue("IsPortalAllowed__", i) || true;
                        configuration.isFaxRoutingAllowed = this.GetQueryValue("IsFaxAllowed__", i) || true;
                        configuration.isOtherRoutingAllowed = this.GetQueryValue("IsOtherAllowed__", i) || true;
                        configuration.DisplaySaveAndQuitButton = this.GetQueryValue("DisplaySaveAndQuitButton__", i) || 0;
                        configuration.DisplaySaveButton = this.GetQueryValue("DisplaySaveButton__", i) || 0;
                        configuration.DisplayRejectButton = this.GetQueryValue("DisplayRejectButton__", i) || 0;
                        configuration.DisplayResubmitButton = this.GetQueryValue("DisplayResubmitButton__", i) || 0;
                        configuration.DisplaySetAsideButton = this.GetQueryValue("DisplaySetAsideButton__", i) || 0;
                        if (!Lib.DD.DocumentTypeManager._existingDocumentTypes[documentType]) {
                            Lib.DD.DocumentTypeManager._existingDocumentTypes[documentType] = [];
                        }
                        Lib.DD.DocumentTypeManager._existingDocumentTypes[documentType].push(configuration);
                    }
                    Lib.DD.DocumentTypeManager.ComputeDocumentTypeList();
                    if (typeof callback === "function") {
                        ProcessInstance.SetSilentChange(true);
                        callback();
                        ProcessInstance.SetSilentChange(false);
                    }
                }
                var filter = "(!(Configuration_template__=1))";
                if (!includeDisabledConfigurations) {
                    filter = "(&" + filter + "(!(Enable_Configuration__=0)))";
                }
                var restrictDocumentFamily = Variable.GetValueAsString("SDADocumentFamily");
                if (restrictDocumentFamily) {
                    filter = "(&" + filter + "(Family__=" + Sys.Helpers.String.EscapeValueForLdapFilter(restrictDocumentFamily) + "))";
                }
                Query.DBQuery(CallBackGetConfiguration, "DD - Application Settings__", "Document_Type__|ConfigurationName__|ConfigurationSelection_Enable__|"
                    + "MatchDocumentLayout__|Family__|FieldsOrder__|Routing__|DefaultDelivery__|"
                    + "IsCOPAllowed__|IsEmailAllowed__|IsArchiveAllowed__|IsMODAllowed__|IsPortalAllowed__|"
                    + "IsFaxAllowed__|IsOtherAllowed__|Show_comment__|Show_recipient_id__|"
                    + "Show_document_number__|DisplaySaveAndQuitButton__|DisplaySaveButton__|"
                    + "DisplayRejectButton__|DisplayResubmitButton__|DisplaySetAsideButton__", filter, null, 99);
            }
            DocumentTypeManager.RetrieveExistingAutoLearningDocumentTypes = RetrieveExistingAutoLearningDocumentTypes;
            function GetDocumentTypeConfig(documentType) {
                if (!Lib.DD.DocumentTypeManager._existingDocumentTypes || !Lib.DD.DocumentTypeManager._existingDocumentTypes[documentType]) {
                    return null;
                }
                return Lib.DD.DocumentTypeManager._existingDocumentTypes[documentType][0];
            }
            DocumentTypeManager.GetDocumentTypeConfig = GetDocumentTypeConfig;
            function FillDocumentTypeControl(callback, includeDisabledConfigurations) {
                DocumentTypeManager._oldDocumentType = DocumentTypeManager._documentTypeControl.GetValue();
                if (!DocumentTypeManager._existingDocumentTypes) {
                    RetrieveExistingAutoLearningDocumentTypes(callback, includeDisabledConfigurations);
                }
                else {
                    Lib.DD.DocumentTypeManager.ComputeDocumentTypeList();
                    if (typeof callback === "function") {
                        callback();
                    }
                }
            }
            DocumentTypeManager.FillDocumentTypeControl = FillDocumentTypeControl;
            function ComputeFamiliesList(newFamily) {
                var families = DocumentTypeManager._existingDBFamilies.slice();
                var currentFamily = Controls.Family__.GetValue();
                var temporaryNewFamily = Variable.GetValueAsString("TemporaryFamily") || newFamily;
                if (currentFamily && currentFamily !== "+") {
                    //We want to set the Family__ value to the value set before reloading the page
                    temporaryNewFamily = currentFamily;
                }
                // authorizing empty "" family
                if (temporaryNewFamily != null) {
                    var matchingFamily = DocumentTypeManager._existingDBFamilies.filter(function (f) {
                        return temporaryNewFamily.toLowerCase() === f.toLowerCase();
                    });
                    if (matchingFamily.length === 0) {
                        families.push(temporaryNewFamily);
                        DocumentTypeManager._familyControl.SetValue(temporaryNewFamily);
                        DocumentTypeManager._oldFamily = temporaryNewFamily;
                    }
                    else {
                        DocumentTypeManager._oldFamily = matchingFamily[0];
                        DocumentTypeManager._familyControl.SetValue(DocumentTypeManager._oldFamily);
                    }
                }
                families.sort();
                var familyOptions = families.map(function (family) {
                    return family + "=" + family;
                });
                familyOptions.unshift("=");
                familyOptions.push("+=" + DocumentTypeManager.AddNewFamilyOption);
                DocumentTypeManager._familyControl.SetAvailableValues(familyOptions);
                if (!DocumentTypeManager.previousFamilyOnChangeCallback && DocumentTypeManager._familyControl.OnChange) {
                    DocumentTypeManager.previousFamilyOnChangeCallback = DocumentTypeManager._familyControl.OnChange;
                }
                DocumentTypeManager._familyControl.OnChange = function () {
                    if (Lib.DD.DocumentTypeManager.previousFamilyOnChangeCallback) {
                        Lib.DD.DocumentTypeManager.previousFamilyOnChangeCallback.apply(Lib.DD.DocumentTypeManager, arguments);
                    }
                    var selectedFamily = Lib.DD.DocumentTypeManager._familyControl.GetValue();
                    if (selectedFamily === "+") {
                        Lib.DD.DocumentTypeManager.DisplayNewFamilyPopup(Lib.DD.DocumentTypeManager._familyControl);
                    }
                    else {
                        Lib.DD.DocumentTypeManager._oldFamily = selectedFamily;
                        Lib.DD_Client.VirtualFieldsManager.Wizard.UnloadFields("Family__", Lib.DD.DocumentTypeManager._familyControl.GetValue());
                    }
                };
            }
            DocumentTypeManager.ComputeFamiliesList = ComputeFamiliesList;
            function FillFamilyControl(familyControl) {
                DocumentTypeManager._familyControl = familyControl;
                var that = this;
                function CallBackWithFamiliesResults() {
                    var err = this.GetQueryError();
                    if (err) {
                        Popup.Alert(err);
                        return;
                    }
                    that._existingDBFamilies = [];
                    for (var i = 0; i < this.GetRecordsCount(); i++) {
                        var family = this.GetQueryValue("Family__", i);
                        if (family && family !== "+") {
                            that._existingDBFamilies.push(family);
                        }
                    }
                    that.ComputeFamiliesList();
                }
                if (!that._existingDBFamilies) {
                    Query.DBQuery(CallBackWithFamiliesResults, "DD - Application Settings__", "Family__", null, null, 99, null, "distinct=1");
                }
            }
            DocumentTypeManager.FillFamilyControl = FillFamilyControl;
            function DisplayNewFamilyPopup(familyControl) {
                var newFamilyControlName = "NewFamily__";
                var that = this;
                var $fillCallback = function (dialog) {
                    dialog.AddText(newFamilyControlName, "_NewFamily");
                    var ctrlLengthError = dialog.AddDescription("ctrlLengthError", "");
                    ctrlLengthError.SetText(Language.Translate("_Length of family is limited to 50 characters", false, 1, 50));
                    ctrlLengthError.SetErrorStyle();
                    dialog.HideControl(ctrlLengthError);
                };
                var addNewFamily = function (newFamily) {
                    newFamily = newFamily || "";
                    newFamily = newFamily.trim();
                    Variable.SetValueAsString("TemporaryFamily", newFamily);
                    that.ComputeFamiliesList(newFamily);
                    Lib.DD_Client.VirtualFieldsManager.Wizard.UnloadFields("Family__", newFamily);
                };
                var $commitCallback = function (dialog) {
                    var newFamily = dialog.GetControl(newFamilyControlName).GetValue();
                    addNewFamily(newFamily);
                };
                var $rollbackCallback = function () {
                    that._familyControl.SetValue(that._oldFamily);
                };
                var $validateNewFamilyCallback = function (dialog, tabId) {
                    var isValid = true;
                    if (!tabId) {
                        var ctrl = dialog.GetControl(newFamilyControlName).GetValue() ? dialog.GetControl(newFamilyControlName).GetValue().trim() : null;
                        if (ctrl && ctrl.length > 50) {
                            var ctrlLengthError = dialog.GetControl("ctrlLengthError");
                            dialog.HideControl(ctrlLengthError, false);
                            isValid = false;
                        }
                    }
                    return isValid;
                };
                Popup.Dialog("_NewFamilyPopupTitle", null, $fillCallback, $commitCallback, $validateNewFamilyCallback, null, $rollbackCallback);
            }
            DocumentTypeManager.DisplayNewFamilyPopup = DisplayNewFamilyPopup;
            function GetConfiguration(documentType) {
                var configurationToRetrieve;
                if (DocumentTypeManager._existingDocumentTypes) {
                    var configurations = DocumentTypeManager._existingDocumentTypes[documentType];
                    if (configurations) {
                        for (var i = 0; i < configurations.length; i++) {
                            //Handle legacy multiple configurations for document type
                            //Prioritize the one with isAutolearning set to true
                            var configuration = configurations[i];
                            configurationToRetrieve = configuration.configurationName;
                            if (configuration.isAutoLearning) {
                                break;
                            }
                        }
                    }
                }
                return configurationToRetrieve;
            }
            DocumentTypeManager.GetConfiguration = GetConfiguration;
            function GetFamilyFromDocumentType(documentType) {
                if (!DocumentTypeManager._existingDocumentTypes) {
                    return null;
                }
                var configuration = DocumentTypeManager._existingDocumentTypes[documentType];
                if (!configuration || configuration.length === 0 || !configuration[0].family) {
                    return null;
                }
                return configuration[0].family;
            }
            DocumentTypeManager.GetFamilyFromDocumentType = GetFamilyFromDocumentType;
            function DisplayNewDocumentTypePopup(oldDocumentType) {
                var that = this;
                var newDocumentTypeControlName = "NewDocumentType__";
                var $fillCallback = function (dialog) {
                    var control = dialog.AddText(newDocumentTypeControlName, "_PopupNewDocumentType");
                    dialog.RequireControl(control);
                    var ctrlLengthError = dialog.AddDescription("ctrlLengthError", "");
                    ctrlLengthError.SetText(Language.Translate("_Length must be between {0} and {1} characters", false, 1, 50));
                    ctrlLengthError.SetErrorStyle();
                    dialog.HideControl(ctrlLengthError);
                };
                var $commitCallback = function (dialog) {
                    var newDocumentType = dialog.GetControl(newDocumentTypeControlName).GetValue();
                    that.AddNewDocumentType(newDocumentType);
                };
                var $rollbackCallback = function () {
                    that.SetDocumentType(oldDocumentType);
                };
                var $validateNewDocumentType = function (dialog, tabId) {
                    var isValid = true;
                    if (!tabId) {
                        var ctrl = dialog.GetControl(newDocumentTypeControlName).GetValue() ? dialog.GetControl(newDocumentTypeControlName).GetValue().trim() : null;
                        if (!ctrl || ctrl.length > 50) {
                            var ctrlLengthError = dialog.GetControl("ctrlLengthError");
                            dialog.HideControl(ctrlLengthError, false);
                            isValid = false;
                        }
                    }
                    return isValid;
                };
                Popup.Dialog("_NewDocumentTypePopupTitle", null, $fillCallback, $commitCallback, $validateNewDocumentType, null, $rollbackCallback);
            }
            DocumentTypeManager.DisplayNewDocumentTypePopup = DisplayNewDocumentTypePopup;
            function HandleDocumentTypeChange() {
                if (DocumentTypeManager._documentTypeChangedCallback) {
                    DocumentTypeManager._documentTypeChangedCallback();
                }
                var documentTypeSelected = DocumentTypeManager._documentTypeControl.GetValue();
                if (documentTypeSelected === DocumentTypeManager.AddNewDocumentTypeOption) {
                    Lib.DD.DocumentTypeManager.DisplayNewDocumentTypePopup(DocumentTypeManager._oldDocumentType);
                }
                else if (DocumentTypeManager._documentTypeAutolearnControl) {
                    DocumentTypeManager._documentTypeAutolearnControl.SetValue(documentTypeSelected);
                }
                DocumentTypeManager._oldDocumentType = documentTypeSelected;
            }
            DocumentTypeManager.HandleDocumentTypeChange = HandleDocumentTypeChange;
            function AddNewDocumentType(newDocumentType) {
                if (newDocumentType) {
                    newDocumentType = newDocumentType.trim();
                    Variable.SetValueAsString("TemporaryDocumentType", newDocumentType);
                    Lib.DD.DocumentTypeManager.ComputeDocumentTypeList();
                }
            }
            DocumentTypeManager.AddNewDocumentType = AddNewDocumentType;
            function SetDocumentType(documentType) {
                DocumentTypeManager._documentTypeControl.SetValue(documentType);
                if (DocumentTypeManager._documentTypeAutolearnControl) {
                    DocumentTypeManager._documentTypeAutolearnControl.SetValue(documentType);
                }
                HandleDocumentTypeChange();
            }
            DocumentTypeManager.SetDocumentType = SetDocumentType;
            function GetAvailableDocumentType(documentType) {
                for (var existingDocumentType in DocumentTypeManager._existingDocumentTypes) {
                    if (documentType.toLowerCase() === existingDocumentType.toLowerCase()) {
                        return existingDocumentType;
                    }
                }
                return documentType;
            }
            DocumentTypeManager.GetAvailableDocumentType = GetAvailableDocumentType;
        })(DocumentTypeManager = DD.DocumentTypeManager || (DD.DocumentTypeManager = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
