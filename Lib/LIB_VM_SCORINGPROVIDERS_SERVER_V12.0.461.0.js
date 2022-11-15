/* LIB_DEFINITION{
  "name": "Lib_VM_ScoringProviders_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Database",
    "Sys/Sys_EmailNotification"
  ]
}*/
var Lib;
(function (Lib) {
    var VM;
    (function (VM) {
        var ScoringProviders;
        (function (ScoringProviders) {
            /**
             * @namespace Server
             * @memberof Lib.VM.ScoringProviders
             */
            var Server;
            (function (Server) {
                // DBSET_READONLY | DBSET_QUICK
                var DBFastAccess = 0x00210000;
                // also returns ownershipped records
                var DBDirtyRead = 0x00020000;
                var tableName = "VM - Risk Scoring__";
                var CTScoreFields = {
                    identifier: "Identifier__",
                    provider: "Provider__",
                    score: "Score__",
                    scoreScale: "ScoreScale__",
                    lastUpdateDate: "LastScoreUpdateDate__",
                    trend: "Trend__",
                    json: "Json__"
                };
                function GetStoredScore(score) {
                    Query.Reset();
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable(tableName);
                    query.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Identifier__", score.identifier), Sys.Helpers.LdapUtil.FilterEqual("Provider__", score.provider)).toString());
                    query.MoveFirst();
                    var result = {
                        values: {},
                        record: query.MoveNextRecord() || Process.CreateTableRecordAsProcessAdmin(tableName),
                        recordVars: null
                    };
                    result.recordVars = result.record.GetVars();
                    // eslint-disable-next-line guard-for-in
                    for (var field in CTScoreFields) {
                        result.values[CTScoreFields[field]] = result.recordVars.GetValue_String(CTScoreFields[field], 0);
                    }
                    return result;
                }
                /**
                 * Function used to get provider credential record for a given provider
                 *
                 * @memberof Lib.VM.ScoringProviders.Server
                 * @param {string} provider - Name of the provider we want to get credential
                 * @return {xRecord} Return the first result of the query as a record
                 */
                function GetProviderCredentials(provider) {
                    var credentialsQuery = Process.CreateQueryAsProcessAdmin();
                    credentialsQuery.Reset();
                    credentialsQuery.SetSpecificTable("VM - Scoring Agency Settings__");
                    credentialsQuery.SetFilter(Sys.Helpers.LdapUtil.FilterEqual("Provider__", provider).toString());
                    credentialsQuery.SetAttributesList("*");
                    credentialsQuery.SetOptions(DBFastAccess | DBDirtyRead);
                    credentialsQuery.SetOptionEx("Limit=1");
                    credentialsQuery.MoveFirst();
                    return credentialsQuery.MoveNextRecord();
                }
                Server.GetProviderCredentials = GetProviderCredentials;
                function HasJsonChanged(storedJson, newScore) {
                    try {
                        var storedScore = JSON.parse(storedJson);
                        if (Object.prototype.hasOwnProperty.call(newScore, "alerts")) {
                            storedScore.alerts = newScore.alerts;
                        }
                        else {
                            delete storedScore.alerts;
                        }
                        return JSON.stringify(storedScore) !== JSON.stringify(newScore);
                    }
                    catch (error) {
                        return true;
                    }
                }
                function RemoveFields(score) {
                    var cleanJSON = Sys.Helpers.Clone(score);
                    var keyToDelete = ["score", "provider", "identifier"];
                    for (var _i = 0, keyToDelete_1 = keyToDelete; _i < keyToDelete_1.length; _i++) {
                        var key = keyToDelete_1[_i];
                        delete cleanJSON[key];
                    }
                    return cleanJSON;
                }
                function UpdateVendorFromCache(storedScore, score) {
                    var vendorQuery = Process.CreateQueryAsProcessAdmin();
                    var ldapFilter = Sys.Helpers.LdapUtil.FilterEqual("DUNSNumber__", storedScore.values[CTScoreFields.identifier]);
                    vendorQuery.Reset();
                    vendorQuery.SetSpecificTable("AP - Vendors__");
                    vendorQuery.SetFilter(ldapFilter.toString());
                    vendorQuery.SetAttributesList("*");
                    var vendorRecord = vendorQuery.MoveFirst() && vendorQuery.MoveNextRecord();
                    while (vendorRecord) {
                        var vendorVars = vendorRecord.GetVars();
                        if (vendorVars.GetValue_String("ShowAlerts__", 0) !== "1" && score.alerts && score.alerts.indicator === "warning") {
                            vendorVars.AddValue_String("ShowAlerts__", "1", true);
                            vendorRecord.Commit();
                        }
                        else if (vendorVars.GetValue_String("ShowAlerts__", 0) !== "0" && (!score.alerts || score.alerts.indicator === "favourable")) {
                            vendorVars.AddValue_String("ShowAlerts__", "0", true);
                            vendorRecord.Commit();
                        }
                        vendorRecord = vendorQuery.MoveNextRecord();
                    }
                }
                function UpdateAlertAndVendor(storedScore, score) {
                    var alerts = null;
                    delete score.alerts;
                    if (parseFloat(storedScore.values[CTScoreFields.score]) !== score.score.value) {
                        var indicator = void 0;
                        if (!isNaN(storedScore.values[CTScoreFields.score])) {
                            indicator = storedScore.values[CTScoreFields.score] > score.score.value ? "warning" : "favourable";
                        }
                        else {
                            indicator = parseFloat(storedScore.values[CTScoreFields.score]) > score.score.value ? "warning" : "favourable";
                        }
                        alerts = {
                            indicator: indicator,
                            list: [{
                                    key: "_RiskScoreHasChange {0} {1}",
                                    parameters: [storedScore.values[CTScoreFields.score], score.score.value]
                                }]
                        };
                    }
                    var args = {
                        storedScore: storedScore,
                        updatedScore: score,
                        alerts: alerts
                    };
                    alerts = Sys.Helpers.TryCallFunction("Lib.VM.Customization.Server.Alerting", args) || alerts;
                    if (alerts !== null) {
                        score.alerts = alerts;
                    }
                    UpdateVendorFromCache(storedScore, score);
                    return score;
                }
                function UpdateScore(storedScore, score) {
                    storedScore.recordVars.AddValue_String(CTScoreFields.identifier, score.identifier, false);
                    storedScore.recordVars.AddValue_String(CTScoreFields.provider, score.provider, false);
                    storedScore.recordVars.AddValue_String(CTScoreFields.score, score.score.value ? score.score.value.toString() : null, true);
                    storedScore.recordVars.AddValue_String(CTScoreFields.scoreScale, score.score.scale, true);
                    storedScore.recordVars.AddValue_String(CTScoreFields.lastUpdateDate, score.score.lastUpdate, true);
                }
                function UpdateTrend(storedScore, score) {
                    if (!storedScore.values[CTScoreFields.score] || !score.score.value) {
                        storedScore.recordVars.AddValue_String(CTScoreFields.trend, "_none", true);
                    }
                    else if ((!isNaN(storedScore.values[CTScoreFields.score]) && storedScore.values[CTScoreFields.score] > score.score.value) ||
                        parseFloat(storedScore.values[CTScoreFields.score]) > score.score.value) {
                        storedScore.recordVars.AddValue_String(CTScoreFields.trend, "_down", true);
                    }
                    else if ((!isNaN(storedScore.values[CTScoreFields.score]) && storedScore.values[CTScoreFields.score] < score.score.value) ||
                        parseFloat(storedScore.values[CTScoreFields.score]) < score.score.value) {
                        storedScore.recordVars.AddValue_String(CTScoreFields.trend, "_up", true);
                    }
                    else {
                        storedScore.recordVars.AddValue_String(CTScoreFields.trend, "_none", true);
                    }
                }
                /**
                 * @namespace Providers
                 * @memberof Lib.VM.ScoringProviders.Server
                 */
                Server.Providers = {
                    /**
                     * @lends Lib.VM.ScoringProviders.Server.Providers
                     */
                    /**
                     * @namespace duns
                     * @memberof Lib.VM.ScoringProviders.Server.Providers
                     */
                    duns: {
                        /**
                         * @lends Lib.VM.ScoringProviders.Server.Providers.duns
                         */
                        /**
                         * Function used to get credential for duns provider
                         *
                         * @memberof Lib.VM.ScoringProviders.Server.Providers.duns
                         * @return {Sys.Scoring.Credentials} Return credential if it's found else return null
                         */
                        GetCredentials: function () {
                            var record = GetProviderCredentials("duns");
                            if (record) {
                                var recordVars = record.GetVars();
                                return {
                                    user: recordVars.GetValue_String("UserId__", 0),
                                    pwd: recordVars.GetValue_String("Password__", 0)
                                };
                            }
                            return null;
                        }
                    },
                    /**
                     * Function used to update score and trend of a stored score
                     * Or create a record if this score if it's a new score
                     * @memberof Lib.VM.ScoringProviders.Server.Providers
                     * @param {Sys.Scoring.JsonData} score - Object containing all information about the score (provider, score value, etc..)
                     */
                    Store: function (score) {
                        if (score && score.score) {
                            if (Sys.Helpers.IsEmpty(score.score.value)) {
                                score.score.value = null;
                            }
                            var storedScore = GetStoredScore(score);
                            var checkLastUpdate = storedScore.values[CTScoreFields.lastUpdateDate] !== score.score.lastUpdate;
                            if (parseFloat(storedScore.values[CTScoreFields.score]) !== score.score.value ||
                                checkLastUpdate ||
                                HasJsonChanged(storedScore.values[CTScoreFields.json], RemoveFields(score))) {
                                if (!Sys.Helpers.IsEmpty(storedScore.values[CTScoreFields.score])) {
                                    score = UpdateAlertAndVendor(storedScore, score);
                                }
                                var cleanJSON = RemoveFields(score);
                                UpdateTrend(storedScore, score);
                                UpdateScore(storedScore, score);
                                storedScore.recordVars.AddValue_String(CTScoreFields.json, JSON.stringify(cleanJSON), true);
                                storedScore.record.Commit();
                            }
                        }
                    },
                    /**
                     * Function used to remove one or multiple scores from the database
                     * @memberof Lib.VM.ScoringProviders.Server.Providers
                     * @param {string[]} identifiers - list of company identifiers to clear from the database
                     * @param {string} provider - From which provider we want to clear those companies
                     */
                    Clear: function (identifiers, provider) {
                        Query.Reset();
                        var processQuery = Process.CreateQueryAsProcessAdmin();
                        processQuery.SetSpecificTable(tableName);
                        processQuery.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("Identifier__", identifiers), Sys.Helpers.LdapUtil.FilterEqual("Provider__", provider)).toString());
                        if (processQuery.MoveFirst()) {
                            var record = processQuery.MoveNextRecord();
                            while (record) {
                                record.Delete();
                                record = processQuery.MoveNextRecord();
                            }
                        }
                        Log.Info("Score deleted for DUNS " + JSON.stringify(identifiers));
                    }
                };
            })(Server = ScoringProviders.Server || (ScoringProviders.Server = {}));
        })(ScoringProviders = VM.ScoringProviders || (VM.ScoringProviders = {}));
    })(VM = Lib.VM || (Lib.VM = {}));
})(Lib || (Lib = {}));
