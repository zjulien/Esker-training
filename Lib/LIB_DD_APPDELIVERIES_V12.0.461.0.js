///#GLOBALS Lib
/* LIB_DEFINITION{
  "name": "LIB_DD_APPDELIVERIES_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "DD Helpers to get deliveries from the activated applications",
  "require": [
    "Lib_DD_Common_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var AppDeliveries;
        (function (AppDeliveries) {
            AppDeliveries._applicationConfigurations = {};
            /**
             * @param {string} appId identifier of the application, as declared in the ODAPP_DEFINITION & ODAPP_INSTANCE records.
             * @returns {object} the requested application data (null if * is requested, or if the configuration is not found)
             */
            function GetApplication(appId) {
                appId = appId || "";
                var appIdCaseInsensitive = appId.toLowerCase();
                if (User.activeApplications) {
                    for (var appKey in User.activeApplications) {
                        var app = User.activeApplications[appKey];
                        if (app.id.toLowerCase() === appIdCaseInsensitive) {
                            return app;
                        }
                    }
                }
                return null;
            }
            AppDeliveries.GetApplication = GetApplication;
            /**
             * @param {transport} appId identifier of the application, as declared in the ODAPP_DEFINITION & ODAPP_INSTANCE records.
             * @returns {boolean} true if the application has been activated for the account, false otherwise
             */
            function IsActive(appId) {
                return !!Lib.DD.AppDeliveries.GetApplication(appId);
            }
            AppDeliveries.IsActive = IsActive;
            /**
             * @description Populates a combobox with active applications
             * @param {control} combo
             * @param {array} identifier of the applications that must be added to the comobo
             * @returns the applications that are in the combo box at the end of the function
             */
            function FeedDeliveryCombo(combo, applications) {
                var result = [];
                var deliveryMethodList = combo.GetAvailableValues();
                var modified = false;
                for (var index = 0; index < applications.length; index++) {
                    var appId = applications[index];
                    if (Lib.DD.AppDeliveries.IsActive(appId)) {
                        var deliveryMethod = appId + "=" + "_DM " + appId;
                        if (deliveryMethodList.indexOf(deliveryMethod) === -1) {
                            deliveryMethodList.push(deliveryMethod);
                            modified = true;
                        }
                        result.push(appId);
                    }
                }
                if (modified) {
                    combo.SetAvailableValues(deliveryMethodList);
                }
                return result;
            }
            AppDeliveries.FeedDeliveryCombo = FeedDeliveryCombo;
            /**
             * @param {control} deliveryCombo combo box containing the deliveries
            */
            function CheckDeliveryMethodError(deliveryCombo, processSelected) {
                var isComboInError = false;
                var delivery = deliveryCombo.GetValue();
                if (delivery === "APPLICATION_PROCESS") {
                    var processList = ProcessInstance.extendedProperties.accountProcesses;
                    processSelected = processSelected || Sys.DD.GetParameter("ProcessSelected__");
                    var configurationTableFound = false;
                    if (processList) {
                        for (var i = 0; i < processList.length; i++) {
                            if (processList[i].Key === processSelected) {
                                configurationTableFound = true;
                            }
                        }
                    }
                    if (!configurationTableFound) {
                        isComboInError = true;
                        deliveryCombo.SetError("_Routing_Process_is_not_found");
                    }
                }
                if (!isComboInError) {
                    deliveryCombo.SetError();
                }
            }
            AppDeliveries.CheckDeliveryMethodError = CheckDeliveryMethodError;
            /**
             * @param {control} deliveryCombo combo box containing the deliveries
             * @param {control} configurationsCombo combo box where the configurations are to be listed
            */
            function LinkDeliveryComboToConfigurationsCombo(deliveryCombo, configurationsCombo) {
                var self = this;
                deliveryCombo.OnChange = function () {
                    var value = deliveryCombo.GetValue();
                    self.HandleConfigurationsComboForDelivery(value, configurationsCombo);
                    Controls.DefaultDeliveryEmail__.Hide(value !== "SM");
                    Controls.ProcessSelected__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
                    Controls.Target_configuration__.Hide(Controls.DefaultDelivery__.GetValue() !== "APPLICATION_PROCESS");
                    Controls.ProcessRelatedConfiguration__.Hide(Controls.DefaultDelivery__.GetValue() !== "COP");
                    self.CheckDeliveryMethodError(deliveryCombo, Controls.ProcessSelected__.GetValue());
                };
                Lib.DD.AppDeliveries.HandleConfigurationsComboForDelivery(deliveryCombo.GetValue(), configurationsCombo);
            }
            AppDeliveries.LinkDeliveryComboToConfigurationsCombo = LinkDeliveryComboToConfigurationsCombo;
            /**
             * @param {string} delivery current delivery
             * @param {control} configurationsCombo combo box where the configurations are to be listed
            */
            function HandleConfigurationsComboForDelivery(delivery, configurationsCombo, addEmptyItem) {
                function UpdateConfigurations(confs) {
                    configurationsCombo.SetAvailableValues(confs);
                    configurationsCombo.SetReadOnly(false);
                    if (!confs.length) {
                        configurationsCombo.SetError("_No configuration found for the application delivery");
                    }
                }
                var processConfigTableName = "";
                var processConfigTableKeyColumn = "";
                function listConfigurationCallback() {
                    var err = this.GetQueryError();
                    if (err) {
                        Popup.Alert(err);
                        return;
                    }
                    var existingConfNames = [];
                    var nbRecords = this.GetRecordsCount();
                    if (addEmptyItem) {
                        existingConfNames.push("");
                    }
                    if (nbRecords > 0) {
                        for (var i = 0; i < nbRecords; i++) {
                            existingConfNames.push(this.GetQueryValue(processConfigTableKeyColumn, i));
                        }
                        configurationsCombo.SetAvailableValues(existingConfNames);
                        configurationsCombo.Hide(true);
                        var targetConfiguration = Sys.DD.GetParameter("Target_configuration__");
                        if (existingConfNames.indexOf(targetConfiguration) !== -1) {
                            configurationsCombo.SetValue(targetConfiguration);
                        }
                    }
                    else if (addEmptyItem) {
                        configurationsCombo.SetAvailableValues([""]);
                    }
                    else {
                        configurationsCombo.Hide(true);
                    }
                    configurationsCombo.SetRequired(false);
                    configurationsCombo.SetReadOnly(false);
                }
                if (delivery === "APPLICATION_PROCESS") {
                    var processList = ProcessInstance.extendedProperties.accountProcesses;
                    var processName = Sys.DD.GetParameter("ProcessSelected__");
                    var configurationTableFound = false;
                    if (processList) {
                        for (var i = 0; i < processList.length; i++) {
                            if (processList[i].Key === processName && processList[i].Conf) {
                                processConfigTableName = processList[i].Conf;
                                processConfigTableKeyColumn = processList[i].ConfKeyColumn;
                                configurationTableFound = true;
                            }
                        }
                        if (configurationTableFound) {
                            Query.DBQuery(listConfigurationCallback, processConfigTableName, processConfigTableKeyColumn, null, null, 99);
                        }
                    }
                    if (!configurationTableFound) {
                        if (addEmptyItem) {
                            configurationsCombo.SetAvailableValues([""]);
                        }
                        else {
                            configurationsCombo.Hide(true);
                        }
                        configurationsCombo.SetRequired(false);
                        configurationsCombo.SetReadOnly(false);
                    }
                }
                else if (Lib.DD.AppDeliveries.GetApplicationConfigurations(delivery, UpdateConfigurations)) {
                    var app = Lib.DD.AppDeliveries.GetApplication(delivery);
                    configurationsCombo.Hide(true);
                    configurationsCombo.SetRequired(app && !!app.configurationTableName);
                    configurationsCombo.SetReadOnly(true);
                }
                else {
                    if (addEmptyItem) {
                        configurationsCombo.SetAvailableValues([""]);
                    }
                    else {
                        configurationsCombo.Hide(true);
                    }
                    configurationsCombo.SetReadOnly(false);
                    configurationsCombo.SetRequired(false);
                }
            }
            AppDeliveries.HandleConfigurationsComboForDelivery = HandleConfigurationsComboForDelivery;
            /**
             * @param {string} appId identifier of the application, as declared in the ODAPP_DEFINITION & ODAPP_INSTANCE records.
             * @param {function(array)} callback called once the configurations have all been loaded
             * @returns {bbolean} true if the appId is associated with configurations, false otherwise
            */
            function GetApplicationConfigurations(appId, callback) {
                if (!Lib.DD.AppDeliveries._applicationConfigurations[appId]) {
                    Lib.DD.AppDeliveries._applicationConfigurations[appId] = null;
                    var app = Lib.DD.AppDeliveries.GetApplication(appId);
                    if (app && app.configurationTableName && app.configurationKeyColumn) {
                        Lib.DD.AppDeliveries._applicationConfigurations[appId] = [];
                        Query.DBQuery(function (query) {
                            var nbRecords = query.GetRecordsCount();
                            for (var index = 0; index < nbRecords; index++) {
                                var confId = query.GetQueryValue(app.configurationKeyColumn, index);
                                Lib.DD.AppDeliveries._applicationConfigurations[appId].push(confId);
                            }
                            callback(Lib.DD.AppDeliveries._applicationConfigurations[appId]);
                        }, app.configurationTableName, app.configurationKeyColumn, "(" + app.configurationKeyColumn + "=*)", "", 99, this);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    callback(Lib.DD.AppDeliveries._applicationConfigurations[appId]);
                }
                return true;
            }
            AppDeliveries.GetApplicationConfigurations = GetApplicationConfigurations;
        })(AppDeliveries = DD.AppDeliveries || (DD.AppDeliveries = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
