/* LIB_DEFINITION{
  "name": "Lib_VM_ScoringProviders_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Vendor Managment scoring provider client library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Gauge_V12.0.461.0",
    "[Sys_DunsClient_V12.0.461.0]",
    "[Sys_Scoring_Common_V12.0.461.0]",
    "Sys/SYS_HELPERS"
  ]
}*/
var Lib;
(function (Lib) {
    var VM;
    (function (VM) {
        /**
         * @namespace ScoringProviders
         * @memberof Lib.VM
         */
        var ScoringProviders;
        (function (ScoringProviders) {
            var Tools = {
                GetQueryRecord: function (queryResult, index) {
                    var res = null;
                    var queryValues = queryResult.GetQueryValue();
                    if (queryValues && queryValues.Records && index < queryValues.Records.length) {
                        var recordValues = queryValues.Records[index];
                        res = {};
                        for (var def in queryValues.RecordsDefinition) {
                            if (Object.prototype.hasOwnProperty.call(queryValues.RecordsDefinition, def)) {
                                res[def] = recordValues[queryValues.RecordsDefinition[def]];
                            }
                        }
                    }
                    return res;
                },
                BuildGaugeObject: function (providerData, gaugeOptions) {
                    var scoreData = providerData.scoreData;
                    var scoreVariation = scoreData.trend__ === "_up" || scoreData.trend__ === "_down" ? scoreData.trend__ : "_none";
                    return {
                        logoPath: Process.GetImageURL(gaugeOptions.imgURL),
                        gauge: {
                            value: scoreData.score__ > -1 ? scoreData.score__ : 0,
                            scoreName: scoreData.json__.scoreName,
                            displayedValue: scoreData.score__ > -1 ? scoreData.score__.toString() : "-",
                            variation: scoreVariation.substr(1),
                            scale: gaugeOptions.scale,
                            thresholds: gaugeOptions.thresholds
                        },
                        footer: {
                            editLink: {
                                hidden: scoreData.json__.isDemoScore === "true",
                                label: Language.Translate("_Refresh", false)
                            },
                            viewMoreLink: {
                                hidden: scoreData.json__.isDemoScore === "true",
                                label: Language.Translate("_More", false),
                                url: providerData.homePageURL,
                                onClick: providerData.onViewMoreClick
                            },
                            alerts: this.AddAlertTile(scoreData)
                        }
                    };
                },
                BuildDefaultGaugeTiles: function (scoreData) {
                    return [
                        {
                            title: Language.Translate("_Last update", false),
                            value: scoreData.lastscoreupdatedate__ ? Language.FormatDate(new Date(scoreData.lastscoreupdatedate__)) : "-"
                        }
                    ];
                },
                GetDelayedData: function (imgURL) {
                    return {
                        logoPath: Process.GetImageURL(imgURL)
                    };
                },
                AddAlertTile: function (scoreData) {
                    if (scoreData.json__.alerts && scoreData.json__.alerts.list && scoreData.json__.alerts.list.length > 0) {
                        var alertsTranslated = [];
                        for (var i = 0; i < scoreData.json__.alerts.list.length; i++) {
                            var args = {
                                key: scoreData.json__.alerts.list[i].key,
                                useBrackets: false,
                                replacements: []
                            };
                            if (scoreData.json__.alerts.list[i].parameters) {
                                for (var j = 0; j < scoreData.json__.alerts.list[i].parameters.length; j++) {
                                    args.replacements.push(scoreData.json__.alerts.list[i].parameters[j]);
                                }
                            }
                            alertsTranslated.push(Language.Translate(args));
                        }
                        return {
                            list: alertsTranslated,
                            indicator: scoreData.json__.alerts.indicator || "warning"
                        };
                    }
                    return null;
                },
                GetDefaultProviderData: function (queryRecord) {
                    return queryRecord ?
                        {
                            provider: queryRecord.PROVIDER__,
                            credentials: ScoringProviders.Providers.GetCredentials(queryRecord),
                            homePageURL: queryRecord.SCORINGAGENCYHOMEPAGE__
                        } : null;
                },
                UpdateTrend: function (currentScoreData, newScore) {
                    var newTrend = "_none";
                    if (currentScoreData && currentScoreData.score__ > -1 && newScore.score.value > -1) {
                        if (currentScoreData.score__ > newScore.score.value) {
                            newTrend = "_down";
                        }
                        else if (currentScoreData.score__ < newScore.score.value) {
                            newTrend = "_up";
                        }
                    }
                    return newTrend;
                },
                UpdateVendorDUNSNumber: function (DUNSNumber) {
                    var companyCodeAndVendorFilter;
                    if (Controls.VendorInfoCompanyCode__.GetText() === "") {
                        companyCodeAndVendorFilter = Sys.Helpers.LdapUtil.FilterEqual("Number__", Controls.VendorInfoVendorNumber__.GetText());
                    }
                    else {
                        companyCodeAndVendorFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Controls.VendorInfoCompanyCode__.GetText()), Sys.Helpers.LdapUtil.FilterEqual("Number__", Controls.VendorInfoVendorNumber__.GetText()));
                    }
                    Query.DBQuery(
                    /**
                     * @this QueryResult
                     */
                    function () {
                        var recordCount = this.GetRecordsCount();
                        if (recordCount > 0 && !this.GetQueryError()) {
                            for (var i = 0; i < recordCount; i++) {
                                var ruidEx = this.GetQueryValue("ruidex", i);
                                var recordValues = { DUNSNumber__: DUNSNumber };
                                Process.UpdateRecord(null, recordValues, ruidEx);
                            }
                        }
                    }, "AP - Vendors__", "ruidex", companyCodeAndVendorFilter.toString(), "", "NO_LIMIT", null, "solvevariables=1");
                }
            };
            /**
             * @namespace Providers
             * @memberof Lib.VM.ScoringProviders
             */
            ScoringProviders.Providers = {
                /**
                 * @lends Lib.VM.ScoringProviders.Providers
                 */
                /**
                 * Function used to create a credential object from a queried record
                 *
                 * @memberof Lib.VM.ScoringProviders.Providers
                 * @param {ESKMap<string>} queryRecord - An object representing a queried record result
                 * @returns {Sys.Scoring.Credentials} Object used to store information about API credentials
                 */
                GetCredentials: function (queryRecord) {
                    return {
                        user: queryRecord.USERID__,
                        pwd: queryRecord.PASSWORD__,
                        contractId: queryRecord.CONTRACTID__
                    };
                },
                /**
                 * Function used to remove old alert and add new alert if it's needed to the new score and return new score with correct alert
                 *
                 * @memberof Lib.VM.ScoringProviders.Providers
                 * @param {Sys.Scoring.ScoreData} currentScoreData - Object containing data which representing the actual score
                 * @param {Sys.Scoring.JsonData} newScore - Object containing data which representing the new score
                 * @returns {Sys.Scoring.JsonData} The new score with the correct alert
                 */
                UpdateAlert: function (currentScoreData, newScore) {
                    delete newScore.alerts;
                    if (currentScoreData &&
                        currentScoreData.score__ > -1 && newScore.score.value > -1 &&
                        currentScoreData.score__ !== newScore.score.value) {
                        newScore.alerts = {
                            indicator: currentScoreData.score__ > newScore.score.value ? "warning" : "favourable",
                            list: [{
                                    key: "_RiskScoreHasChange {0} {1}",
                                    parameters: [currentScoreData.score__.toString(), newScore.score.value.toString()]
                                }]
                        };
                    }
                    return newScore;
                },
                /**
                 * @namespace duns
                 * @memberof Lib.VM.ScoringProviders.Providers
                 */
                duns: {
                    /**
                     * @lends Lib.VM.ScoringProviders.Providers.duns
                     */
                    name: "duns",
                    storageAllowed: true,
                    imgURL: "public\\creditScoreProvider_duns_logo.png",
                    previousScoreRuid: "",
                    /**
                     * Getter to know if this provider is allowed
                     *
                     * @memberof Lib.VM.ScoringProviders.Providers.duns
                     * @returns {boolean} Is allowed
                     */
                    IsAllowed: function () { return true; },
                    /**
                     * Function used to build a scoreProvider object from a queried record
                     *
                     * @memberof Lib.VM.ScoringProviders.Providers.duns
                     * @param {ESKMap<string>} queryRecord - A query record from the scoring agency table
                     * @returns {Sys.Scoring.ScoreProvider} The object containing information about the provider
                     */
                    GetProviderData: Tools.GetDefaultProviderData,
                    /**
                     * Function used to retrieve gauge information of a company and call a callback with gauge information
                     *
                     * @memberof Lib.VM.ScoringProviders.Providers.duns
                     * @param {any} company - Object representing a company
                     * @param {Sys.Scoring.Credentials} credentials - Representing the provider credential used to call the API
                     * @param {Function} callback - callback: (gaugeData: Sys.Scoring.GaugeObject, saveScore?: boolean) => void -  Call the callback with gaugeData (Sys.Scoring.GaugeObject) when is retrieved or an error object if is not successful
                     */
                    RequestData: function (company, credentials, callback) {
                        var _this = this;
                        var provider = new Sys.DunsClient(credentials);
                        var GetCompanyData = function (DUNSNumber) {
                            provider.GetCompanyData(DUNSNumber, function (rawData) {
                                if (rawData.error) {
                                    callback({ error: true, msg: rawData.msg });
                                    return;
                                }
                                if (ScoringProviders.ScoringProvider.scoreProviders && ScoringProviders.ScoringProvider.scoreProviders[_this.name]) {
                                    var currentScoreProvider = ScoringProviders.ScoringProvider.scoreProviders[_this.name];
                                    if ((!ScoringProviders.ScoringProvider.company.DUNSNumber || ScoringProviders.ScoringProvider.company.DUNSNumber === "") && DUNSNumber !== "") {
                                        Controls.VendorInfoDUNSNumber__.SetText(DUNSNumber);
                                        ScoringProviders.ScoringProvider.company.DUNSNumber = DUNSNumber;
                                        Tools.UpdateVendorDUNSNumber(DUNSNumber);
                                    }
                                    if (currentScoreProvider.scoreData) {
                                        rawData = ScoringProviders.Providers.UpdateAlert(currentScoreProvider.scoreData, rawData);
                                    }
                                    var cleanJSON = ScoringProviders.ScoringProvider.RemoveFields(rawData);
                                    var checkLastUpdate = !currentScoreProvider.scoreData || currentScoreProvider.scoreData.lastscoreupdatedate__ !== rawData.score.lastUpdate;
                                    var scoreValue = rawData.score.value ? rawData.score.value : -1;
                                    var saveScore = false;
                                    if (!currentScoreProvider.scoreData ||
                                        currentScoreProvider.scoreData.score__ !== scoreValue ||
                                        checkLastUpdate ||
                                        HasJsonChanged(currentScoreProvider.scoreData.json__, cleanJSON)) {
                                        var newTrend = Tools.UpdateTrend(currentScoreProvider.scoreData, rawData);
                                        var scoreData = {
                                            provider__: _this.name,
                                            score__: scoreValue,
                                            scorescale__: rawData.score.scale,
                                            lastscoreupdatedate__: rawData.score.lastUpdate,
                                            trend__: newTrend,
                                            json__: cleanJSON
                                        };
                                        saveScore = true;
                                        ScoringProviders.ScoringProvider.UpdateScoreData(currentScoreProvider, scoreData);
                                    }
                                    callback(_this.GetData(currentScoreProvider), saveScore);
                                }
                            }, "FailureScore");
                        };
                        // D&B webservices calls
                        provider.GetSessionKey(function (isAuthentificated) {
                            if (!isAuthentificated) {
                                callback({ error: true, msg: "_ErrorAuthentification" });
                                return;
                            }
                            var DUNSNumber = Controls.VendorInfoDUNSNumber__.GetText();
                            if (DUNSNumber) {
                                GetCompanyData(DUNSNumber);
                            }
                            else {
                                // Display popup and get companies infos
                                provider.GetCompaniesInfos(company, function (business) {
                                    if (business.error) {
                                        callback(business);
                                    }
                                    else if (business.needSelection) {
                                        provider.DisplaySelectPopup(function (selectedBusiness) {
                                            if (selectedBusiness.noSelection) {
                                                callback(selectedBusiness);
                                            }
                                            else {
                                                GetCompanyData(selectedBusiness.id);
                                            }
                                        });
                                    }
                                    else {
                                        GetCompanyData(business.id);
                                    }
                                });
                            }
                        });
                    },
                    /**
                     * Function used to build the gauge object used to create the html component
                     *
                     * @memberof Lib.VM.ScoringProviders.Providers.duns
                     * @param {Sys.Scoring.ScoreProvider} providerData - Object representing a the score provider with all data like scoreData
                     * @returns {Sys.Scoring.GaugeObject} The gauge object with all data used to build the html component
                     */
                    GetData: function (providerData) {
                        var scoreData = providerData.scoreData;
                        var scoreScale = scoreData.scorescale__.split("-");
                        var riskIndicator = { "1": "favourable", "4": "alert" };
                        var layoffRiskIndicator = { "1": "favourable", "5": "alert" };
                        var delinquencyRiskIndicator = { "0": "highRisk", "1": "favourable", "5": "alert" };
                        var scoreDescription = { "0": "_ExtremRisk", "1": "_LowRisk", "2": "_LowtoMediumRisk", "3": "_MediumRisk", "4": "_MediumtoHighRisk", "5": "_HighRisk" };
                        var gaugeOptions = {
                            imgURL: this.imgURL,
                            scale: {
                                min: { val: scoreScale[0] },
                                max: { val: scoreScale[1] }
                            },
                            thresholds: [
                                { maxVal: 0, color: "black" },
                                { maxVal: 20, color: "red" },
                                { maxVal: 40, color: "orange" },
                                { maxVal: 60, color: "yellow" },
                                { maxVal: 100, color: "green" }
                            ]
                        };
                        var gaugeObject = Tools.BuildGaugeObject(providerData, gaugeOptions);
                        gaugeObject.footer.tiles = [
                            {
                                title: Language.Translate("_Rating", false),
                                value: scoreData.json__.rating && scoreData.json__.rating.rating ? scoreData.json__.rating.rating : "-",
                                indicator: scoreData.json__.rating && scoreData.json__.rating.riskSegment ? riskIndicator[scoreData.json__.rating.riskSegment] : ""
                            },
                            {
                                title: Language.Translate("_Last update", false),
                                value: scoreData.lastscoreupdatedate__ ? Language.FormatDate(new Date(scoreData.lastscoreupdatedate__)) : "-",
                                indicator: ""
                            },
                            {
                                title: Language.Translate("_LayoffRisk", false),
                                value: scoreData.json__.layOffScore ? Language.Translate(scoreDescription[scoreData.json__.layOffScore]) : "-",
                                indicator: layoffRiskIndicator[scoreData.json__.layOffScore] ? layoffRiskIndicator[scoreData.json__.layOffScore] : ""
                            },
                            {
                                title: Language.Translate("_DelinquencyRisk", false),
                                value: scoreData.json__.delinquencyScore || scoreData.json__.delinquencyScore === 0 ? Language.Translate(scoreDescription[scoreData.json__.delinquencyScore]) : "-",
                                indicator: delinquencyRiskIndicator[scoreData.json__.delinquencyScore] ? delinquencyRiskIndicator[scoreData.json__.delinquencyScore] : ""
                            }
                        ];
                        return gaugeObject;
                    }
                }
            };
            /**
             * Function used to add and display gauge
             *
             * @memberof Lib.VM.ScoringProviders
             * @param { ESKMap<Sys.Scoring.ScoreProvider> } scoreProviders - Object representing all the scoring provider we want to diplay
             */
            function DisplayGauge(scoreProviders) {
                for (var provider in scoreProviders) {
                    if (ScoringProviders.Providers[provider] && ScoringProviders.Providers[provider] != {}) {
                        if (scoreProviders[provider].scoreData) {
                            ScoringProviders.Providers[provider].previousScoreRuid = scoreProviders[provider].scoreData.ruid;
                            var immediateData = ScoringProviders.Providers[provider].GetData(scoreProviders[provider]);
                            immediateData.providerData = scoreProviders[provider];
                            immediateData.name = provider + "_" + scoreProviders[provider].scoreData.msn;
                            Lib.Gauge.AddGauge(immediateData);
                        }
                        else {
                            var delayedData = Tools.GetDelayedData(ScoringProviders.Providers[provider].imgURL);
                            delayedData.providerData = scoreProviders[provider];
                            delayedData.name = provider + "_delayed";
                            Lib.Gauge.AddDelayedGauge(delayedData);
                        }
                    }
                }
            }
            ScoringProviders.DisplayGauge = DisplayGauge;
            /**
             * Function used to reset alerts
             * Pass the ShowAlerts__ value in AP - Vendors__ record to 0
             * and hide alerts pane
             * @memberof Lib.VM.ScoringProviders
             */
            function ResetAlerts() {
                if (Controls.ShowAlerts__.IsChecked()) {
                    Controls.Alerts.Hide(true);
                    Controls.ShowAlerts__.Check(false);
                    var companyCodeAndVendorFilter = void 0;
                    if (Controls.VendorInfoCompanyCode__.GetText() === "") {
                        companyCodeAndVendorFilter = Sys.Helpers.LdapUtil.FilterEqual("Number__", Controls.VendorInfoVendorNumber__.GetText());
                    }
                    else {
                        companyCodeAndVendorFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Controls.VendorInfoCompanyCode__.GetText()), Sys.Helpers.LdapUtil.FilterEqual("Number__", Controls.VendorInfoVendorNumber__.GetText()));
                    }
                    Query.DBQuery(
                    /**
                     * @this QueryResult
                     */
                    function () {
                        var recordCount = this.GetRecordsCount();
                        if (recordCount > 0 && !this.GetQueryError()) {
                            for (var i = 0; i < recordCount; i++) {
                                var ruidEx = this.GetQueryValue("ruidex", i);
                                var recordValues = { ShowAlerts__: "0" };
                                Process.UpdateRecord(null, recordValues, ruidEx);
                            }
                        }
                    }, "AP - Vendors__", "ruidex", companyCodeAndVendorFilter.toString(), "", "NO_LIMIT", null, "solvevariables=1");
                }
            }
            ScoringProviders.ResetAlerts = ResetAlerts;
            function HasJsonChanged(storedJson, newScore) {
                storedJson = Sys.Helpers.Clone(storedJson);
                if (Object.prototype.hasOwnProperty.call(newScore, "alerts")) {
                    storedJson.alerts = newScore.alerts;
                }
                else {
                    delete storedJson.alerts;
                }
                return JSON.stringify(storedJson) !== JSON.stringify(newScore);
            }
            /**
             * @namespace ScoringProvider
             * @memberof Lib.VM.ScoringProviders
             */
            ScoringProviders.ScoringProvider = {
                /**
                 * @lends Lib.VM.ScoringProviders.ScoringProvider
                 */
                company: null,
                hasProviders: false,
                hasScores: false,
                /**
                 * Function used to Init container controller
                 *
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { HTML } containerCtrl - The html container controller
                 */
                Init: function (containerCtrl) {
                    Lib.Gauge.Init(containerCtrl);
                    Lib.Gauge.OnRefresh = function (data, resolveCB) {
                        if (data && data.providerData && data.providerData.provider &&
                            ScoringProviders.ScoringProvider.company) {
                            ScoringProviders.Providers[data.providerData.provider].RequestData(ScoringProviders.ScoringProvider.company, data.providerData.credentials, function (gaugeData, saveScore) {
                                if (saveScore === void 0) { saveScore = false; }
                                if (saveScore) {
                                    ScoringProviders.ScoringProvider.StoreScore(gaugeData, data, resolveCB);
                                }
                                else {
                                    resolveCB(gaugeData);
                                }
                            });
                        }
                        Lib.VM.ScoringProviders.ResetAlerts();
                    };
                },
                /**
                 * Function used to know if current vendor have providers
                 *
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @return { Boolean } Return if current vendor have providers
                 */
                HasProviders: function () {
                    return ScoringProviders.ScoringProvider.hasProviders;
                },
                /**
                 * Function used to clean a score json object by removing useless data
                 *
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { Sys.Scoring.JsonData } score - The score json object to clean
                 * @return { Sys.Scoring.JsonData } The cleaned version of the score json object
                 */
                RemoveFields: function (score) {
                    var cleanJSON = Sys.Helpers.Clone(score);
                    var keyToDelete = ["score", "provider", "identifier"];
                    for (var _i = 0, keyToDelete_1 = keyToDelete; _i < keyToDelete_1.length; _i++) {
                        var key = keyToDelete_1[_i];
                        delete cleanJSON[key];
                    }
                    return cleanJSON;
                },
                /**
                 * Function used to store the score in the database
                 * Create or update the record if already exist
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { Sys.Scoring.GaugeObject } gaugeData - The current gauge data
                 * @param { Sys.Scoring.GaugeObject } data - The object used to update or create record data
                 * @param { Function } resolveCB - (gaugeData: Sys.Scoring.GaugeObject) => void call this callback with gaugeData param
                 */
                StoreScore: function (gaugeData, data, resolveCB) {
                    if (data && gaugeData && !gaugeData.error) {
                        var scoreData = data.providerData.scoreData;
                        if (scoreData) {
                            var recordData = {
                                "Score__": scoreData.score__ > -1 ? scoreData.score__.toString() : null,
                                "ScoreScale__": scoreData.scorescale__,
                                "Trend__": scoreData.trend__,
                                "Json__": JSON.stringify(scoreData.json__),
                                "LastScoreUpdateDate__": scoreData.lastscoreupdatedate__
                            };
                            if (ScoringProviders.Providers[data.providerData.provider].previousScoreRuid) {
                                Process.UpdateRecord(null, recordData, ScoringProviders.Providers[data.providerData.provider].previousScoreRuid);
                            }
                            else if (ScoringProviders.ScoringProvider.company) {
                                recordData.Provider__ = data.providerData.provider;
                                recordData.Identifier__ = ScoringProviders.ScoringProvider.company.DUNSNumber;
                                Process.CreateTableRecord("VM - Risk scoring__", recordData, {
                                    callback: function (dataCreated) {
                                        if (!data.error) {
                                            ScoringProviders.Providers[data.providerData.provider].previousScoreRuid = dataCreated.ruid;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    resolveCB(gaugeData);
                },
                /**
                 * Function used to update scoreProvider with new score data
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { Sys.Scoring.ScoreProvider } scoreProvider - The current score provider
                 * @param { Sys.Scoring.ScoreData } scoreData - The new score data to save in current score provider
                 * @return { Sys.Scoring.ScoreProvider } Return updated scoreProvider, but return null if scoreProvider or scoreData is null
                 */
                UpdateScoreData: function (scoreProvider, scoreData) {
                    if (scoreProvider && scoreData) {
                        scoreProvider.scoreData = scoreData;
                        return scoreProvider;
                    }
                    return null;
                },
                /**
                 * Function used to create scoreProviders from the query result if they are retrieved
                 * Also this function hide or show pannel risk scoring
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { QueryResult } queryResult - The result of query on scoring provider configuration
                 */
                GetScoreProviderCallback: function (queryResult) {
                    if (!queryResult) {
                        return;
                    }
                    var recordCount = queryResult.GetRecordsCount();
                    ScoringProviders.ScoringProvider.scoreProviders = {};
                    ScoringProviders.ScoringProvider.hasProviders = false;
                    if (recordCount > 0 && !queryResult.GetQueryError()) {
                        Controls.SupplierRiskScoringPanel.Hide(false);
                        Controls.Alerts.Hide(!Controls.ShowAlerts__.IsChecked());
                        for (var i = 0; i < recordCount; i++) {
                            var providerId = queryResult.GetQueryValue("Provider__", i).toLowerCase();
                            if (ScoringProviders.Providers[providerId] && ScoringProviders.Providers[providerId].IsAllowed(queryResult, i)) {
                                ScoringProviders.ScoringProvider.scoreProviders[providerId] = ScoringProviders.Providers[providerId].GetProviderData(Tools.GetQueryRecord(queryResult, i));
                                ScoringProviders.ScoringProvider.hasProviders = true;
                            }
                        }
                    }
                    else {
                        Controls.SupplierRiskScoringPanel.Hide(true);
                    }
                },
                /**
                 * Function used to fill score data information in the scoring provider with the result of query
                 * on the local table saving score information
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { QueryResult } queryResult - The result of query on local table which is saving score information
                 */
                GetScoreDataCallback: function (queryResult) {
                    if (queryResult) {
                        var attributes = queryResult.GetQueryValue().RecordsDefinition;
                        var recordCount = queryResult.GetRecordsCount();
                        ScoringProviders.ScoringProvider.hasScores = false;
                        for (var i = 0; i < recordCount; i++) {
                            var scoreData = {
                                provider__: "",
                                score__: -1,
                                scorescale__: "1-100",
                                lastscoreupdatedate__: "",
                                json__: {
                                    scoreName: ""
                                }
                            };
                            // eslint-disable-next-line guard-for-in
                            for (var attr in attributes) {
                                var attrName = attr.toLowerCase();
                                if (attrName === "json__") {
                                    scoreData[attrName] = !Sys.Helpers.IsEmpty(queryResult.GetQueryValue(attr, i)) ?
                                        JSON.parse(queryResult.GetQueryValue(attr, i)) :
                                        queryResult.GetQueryValue(attr, i);
                                }
                                else if (attrName === "score__") {
                                    scoreData[attrName] = !Sys.Helpers.IsEmpty(queryResult.GetQueryValue(attr, i)) ?
                                        parseInt(queryResult.GetQueryValue(attr, i), 10) :
                                        -1;
                                }
                                else {
                                    scoreData[attrName] = queryResult.GetQueryValue(attr, i);
                                }
                            }
                            if (ScoringProviders.Providers[scoreData.provider__] && ScoringProviders.Providers[scoreData.provider__].IsAllowed()) {
                                ScoringProviders.ScoringProvider.scoreProviders[scoreData.provider__] = ScoringProviders.ScoringProvider.scoreProviders[scoreData.provider__] || {
                                    credentials: {
                                        contractId: "",
                                        pwd: "",
                                        user: ""
                                    },
                                    homePageURL: "",
                                    provider: scoreData.provider__
                                };
                                ScoringProviders.ScoringProvider.scoreProviders[scoreData.provider__].scoreData = scoreData;
                                ScoringProviders.ScoringProvider.hasScores = true;
                            }
                        }
                        Lib.VM.ScoringProviders.DisplayGauge(ScoringProviders.ScoringProvider.scoreProviders);
                    }
                    if (!ScoringProviders.ScoringProvider.hasProviders && !ScoringProviders.ScoringProvider.hasScores) {
                        Lib.Gauge.SetError("_Error");
                    }
                },
                /**
                 * Function used to do the query to init scoring provider and score information for a company
                 * @memberof Lib.VM.ScoringProviders.ScoringProvider
                 * @param { Sys.Scoring.CompanyData } companyData - An object used to identify a company to build query filter
                 */
                OnStart: function (companyData) {
                    if (!companyData) {
                        return;
                    }
                    ScoringProviders.ScoringProvider.company = companyData;
                    Query.DBQuery(
                    /**
                    * @this QueryResult
                    */
                    function () {
                        ScoringProviders.ScoringProvider.GetScoreProviderCallback(this);
                        var scoreFilter = "(Identifier__=".concat(ScoringProviders.ScoringProvider.company.DUNSNumber, ")");
                        Query.DBQuery(
                        /**
                         * @this QueryResult
                         */
                        function () {
                            ScoringProviders.ScoringProvider.GetScoreDataCallback(this);
                        }, "VM - Risk Scoring__", "", scoreFilter, "LastScoreUpdateDate__ DESC");
                    }, "VM - Scoring Agency Settings__", "Provider__|ContractId__|UserId__|Password__|ScoringAgencyHomePage__", "longId=*", "", "NO_LIMIT");
                }
            };
        })(ScoringProviders = VM.ScoringProviders || (VM.ScoringProviders = {}));
    })(VM = Lib.VM || (Lib.VM = {}));
})(Lib || (Lib = {}));
