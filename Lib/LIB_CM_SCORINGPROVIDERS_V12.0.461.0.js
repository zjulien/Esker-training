/* LIB_DEFINITION{
  "name": "Lib_CM_ScoringProviders_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "LIB_GAUGE_V12.0.461.0",
    "Sys/Sys_CM_EllisphereClient",
    "Sys/Sys_CM_CreditRiskMonitorClient",
    "Sys/Sys_CM_DunsClient",
    "Sys/Sys_CM_CreditSafeClient",
    "Sys/Sys_CM_CreditorWatchClient",
    "Sys/Sys_CM_ExperianClient",
    "Sys/SYS_HELPERS",
    "LIB_CM_CUSTOMERHELPER_V12.0.461.0",
    "LIB_CM_CREDITSCORECLIENT_V12.0.461.0",
    "[LIB_CM_CUSTOMIZATION_GAUGE]"
  ]
}*/

var Lib = Lib || {};
Lib.CM = Lib.CM || {};

Lib.CM.ScoringProviders = (function ()
{
	var overallBusinessRisk = "_Overall business risk";
	var lastUpdate = "_Last update";

	var Tools = {
		GetQueryRecord: function (queryResult, index)
		{
			var res = null;
			var queryValues = queryResult.GetQueryValue();
			if (queryValues && queryValues.Records && index < queryValues.Records.length)
			{
				var recordValues = queryValues.Records[index];
				res = {};
				for (var def in queryValues.RecordsDefinition)
				{
					res[def] = recordValues[queryValues.RecordsDefinition[def]];
				}
			}

			return res;
		},
		BuildGaugeObject: function (providerData)
		{
			var scoreData = providerData.scoreData;
			return {
				logoPath: Process.GetImageURL(providerData.imgURL),
				gauge: {
					value: isNaN(scoreData.score__) ? 0 : parseInt(scoreData.score__, 10),
					scoreName: scoreData.json__.scoreName,
					displayedValue: scoreData.score__,
					variation: scoreData.trend__ === "up" || scoreData.trend__ === "down" ? scoreData.trend__ : "none",
					scale: providerData.scale,
					thresholds: providerData.thresholds
				},
				footer: {
					editLink: {
						hidden: scoreData.json__.isDemoScore === "true",
						label: Language.Translate("_Edit", false)
					},
					viewMoreLink: {
						hidden: scoreData.json__.isDemoScore === "true",
						label: Language.Translate("_More", false),
						url: providerData.homePageUrl,
						onClick: providerData.onViewMoreClick
					},
					alerts: this.AddAlertTile(scoreData)
				}
			};
		},
		BuildDefaultGaugeTiles: function (scoreData)
		{
			return [
				{
					title: Language.Translate("_Credit opinion", false),
					value: Lib.CM.CustomerHelper.CurrencyFormat(scoreData.creditopinion__, scoreData.creditopinioncurrency__)
				},
				{
					title: Language.Translate(lastUpdate, false),
					value: scoreData.lastupdatedate__ ? Language.FormatDate(new Date(scoreData.lastupdatedate__)) : "&nbsp;"

				},
				{
					title: Language.Translate("_Privileges", false),
					value: scoreData.nbprivileges__,
					indicator: !isNaN(scoreData.nbprivileges__) && parseInt(scoreData.nbprivileges__, 10) > 0 ? "alert" : "favourable"
				},
				{
					title: Language.Translate("_Defaults", false),
					value: Language.Translate(scoreData.paymentdefaultscomment__ ? "_Yes" : "_No"),
					indicator: scoreData.paymentdefaultscomment__ ? "alert" : "favourable"
				}
			];
		},
		GetDelayedData: function (imgURL)
		{
			return {
				logoPath: Process.GetImageURL(imgURL),
				footer: {
					editLink: {
						label: Language.Translate("_Edit", false)
					}
				}
			};
		},
		AddAlertTile: function (scoreData)
		{
			if (scoreData.json__.alerts && scoreData.json__.alerts.list && scoreData.json__.alerts.list.length > 0)
			{
				var alertsTranslated = [];
				for (var i = 0; i < scoreData.json__.alerts.list.length; i++)
				{
					var args = {
						key: scoreData.json__.alerts.list[i].key,
						useBrackets: false
					};
					if (scoreData.json__.alerts.list[i].parameters)
					{
						args.replacements = [];
						for (var j = 0; j < scoreData.json__.alerts.list[i].parameters.length; j++)
						{
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
		GetDefaultProviderData: function (queryRecord)
		{
			return queryRecord ?
				{
					provider: queryRecord.PROVIDER__,
					credentials: Providers.GetCredentials(queryRecord),
					homePageUrl: queryRecord.CREDITRATINGHOMEPAGE__
				} : null;
		}
	};

	var Providers = {
		GetCredentials: function (queryRecord)
		{
			return {
				user: queryRecord.USERID__,
				pwd: queryRecord.PASSWORD__,
				contractId: queryRecord.CONTRACTID__,
				clientId: queryRecord.CLIENTID__,
				clientSecret: queryRecord.CLIENTSECRET__,
				subcode: queryRecord.SUBCODE__
			};
		},
		ellisphere: {
			name: "ellisphere",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_ellisphere_logo.png",
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.EllisphereClient(credentials);

				company.thirdPartiesIds = company.thirdPartiesIds || {};
				if (!company.thirdPartiesIds.ellisphereId)
				{
					if (Data.GetValue("SIREN__"))
					{
						company.thirdPartiesIds.ellisphereId = Data.GetValue("SIREN__").replace(/ /g, '');
					}
					else if (Data.GetValue("SIRET__"))
					{
						company.thirdPartiesIds.ellisphereId = Data.GetValue("SIRET__").replace(/ /g, '').substr(0, 9);
					}
					else if (Data.GetValue("TvaIntra__"))
					{
						company.thirdPartiesIds.ellisphereId = Data.GetValue("TvaIntra__").replace(/ /g, '').slice(-9);
					}
					else
					{
						callback({ error: "no correct id to find a score" });
						return;
					}

					ScoringProviders.StoreThirdPartiesId(company.thirdPartiesIds.ellisphereId, "ellisphereId");
				}

				provider.GetCompanyData(company.thirdPartiesIds.ellisphereId, function (rawData)
				{
					if (rawData.error)
					{
						callback(rawData);
						return;
					}

					var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
						score__: rawData.score.value,
						scorescale__: rawData.score.scale,
						nbprivileges__: rawData.privileges.nb,
						privilegesamount__: rawData.privileges.amount,
						privilegescurrency__: rawData.privileges.currency,
						paymentdefaultscomment__: rawData.paymentDefaults,
						creditopinion__: rawData.creditOpinion.value,
						creditopinioncurrency__: rawData.creditOpinion.currency,
						lastupdatedate__: rawData.score.lastUpdate,
						thirdpartyid__: rawData.businessId,
						json__: rawData
					}));
					callback(wrapData);
				});
			},
			IsAllowed: function () { return true; },
			GetProviderData: Tools.GetDefaultProviderData,
			GetData: function (providerData)
			{
				providerData.imgURL = this.imgURL;
				providerData.scale = { min: { val: 0 }, max: { val: 10 } };
				providerData.thresholds = [
					{ maxVal: 0, color: "black" },
					{ maxVal: 2, color: "red" },
					{ maxVal: 4, color: "orange" },
					{ maxVal: 6, color: "yellow" },
					{ maxVal: 10, color: "green" }
				];

				var scoreData = providerData.scoreData;
				var gaugeObject = Tools.BuildGaugeObject(providerData);

				gaugeObject.footer.tiles = Tools.BuildDefaultGaugeTiles(scoreData);
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.Ellisphere.Interface", scoreData, gaugeObject) || gaugeObject;
			}
		},
		duns: {
			name: "duns",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_duns_logo.png",
			IsAllowed: function () { return true; },
			GetProviderData: Tools.GetDefaultProviderData,
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.DunsClient(credentials);
				function GetCompanyData(args)
				{
					provider.GetCompanyData(args.companyId, function (rawData)
					{
						if (rawData.error)
						{
							callback(rawData);
							return;
						}
						ScoringProviders.StoreThirdPartiesId(args.companyId, "dunsId");
						company.thirdPartiesIds.dunsId = args.companyId;
						var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
							score__: rawData.score.value,
							lastupdatedate__: rawData.score.lastUpdate,
							thirdpartyid__: rawData.businessId,
							json__: rawData
						}));
						callback(wrapData);
					});
				}
				provider.GetSessionKey(function (isAuthentificated)
				{
					if (!isAuthentificated)
					{
						callback({ error: true, msg: "_Error" });
						return;
					}

					if (Data.GetValue("DUNS__"))
					{
						GetCompanyData({ companyId: Data.GetValue("DUNS__") });
						return;
					}
					else if (!action && company.thirdPartiesIds && company.thirdPartiesIds.dunsId)
					{
						GetCompanyData({ companyId: company.thirdPartiesIds.dunsId });
						return;
					}
					provider.GetCompaniesInfos(company, function (business)
					{
						if (business.error)
						{
							callback(business);
							return;
						}

						if (business.needSelection)
						{
							provider.DisplaySelectPopup(function (selectedBusiness)
							{
								if (selectedBusiness.noSelection)
								{
									callback(selectedBusiness);
									return;
								}
								GetCompanyData({ companyId: selectedBusiness.id });
							});
							return;
						}

						GetCompanyData({ companyId: business.id });
					});
				});
			},
			GetData: function (providerData)
			{
				providerData.imgURL = this.imgURL;
				providerData.scale = {
					min: { val: 0, displayVal: Language.Translate("_duns scale - High risk", false) },
					max: { val: 4, displayVal: Language.Translate("_duns scale - Low risk", false) }
				};
				providerData.thresholds = [
					{ maxVal: 0, color: "black" },
					{ maxVal: 1, color: "red" },
					{ maxVal: 2, color: "orange" },
					{ maxVal: 3, color: "yellow" },
					{ maxVal: 4, color: "green" }
				];

				var gaugeObject = Tools.BuildGaugeObject(providerData);
				gaugeObject.gauge.displayedValue = providerData.scoreData.json__.score.rating;
				gaugeObject.footer.tiles = [
					{
						title: Language.Translate("_CompanyStatus", false),
						value: Language.Translate(providerData.scoreData.json__.companyStatus.isActive ? "_Active" : "_Inactive", false),
						indicator: providerData.scoreData.json__.companyStatus.isActive ? "favourable" : "alert"
					},
					{
						title: Language.Translate("_PaydexInDay", false),
						value: providerData.scoreData.json__.paydexInDays || Language.Translate("_Not available", false)
					},
					{
						title: Language.Translate("_CreditLimit", false),
						value: isNaN(providerData.scoreData.json__.maximumRecommendedLimit.value) ?	"-" :
							Lib.CM.CustomerHelper.CurrencyFormat(
								providerData.scoreData.json__.maximumRecommendedLimit.value,
								providerData.scoreData.json__.maximumRecommendedLimit.currency
							)
					},
					{
						title: Language.Translate("_HasLiens", false),
						value: Language.Translate(providerData.scoreData.json__.hasLiens ? "_Yes" : "_No", false),
						indicator: providerData.scoreData.json__.hasLiens ? "alert" : "favourable"

					}
				];
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.Duns.Interface", providerData.scoreData, gaugeObject) || gaugeObject;
			}
		},
		creditriskmonitor: {
			name: "creditriskmonitor",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_creditRiskMonitor_logo.png",
			IsAllowed: function (queryResult, index) { return queryResult.GetQueryValue("USERLOGIN__", index) === User.loginId; },
			GetProviderData: Tools.GetDefaultProviderData,
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.CreditRiskMonitorClient(credentials);
				function GetCompanyData(id)
				{
					provider.GetCompanyData(id, function (rawData)
					{
						if (rawData.error)
						{
							callback(rawData);
							return;
						}
						company.thirdPartiesIds.crmId = id;
						var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
							score__: rawData.score.value,
							scorescale__: rawData.score.scale,
							nbprivileges__: rawData.privileges.nb,
							privilegesamount__: rawData.privileges.amount,
							privilegescurrency__: rawData.privileges.currency,
							paymentdefaultscomment__: rawData.paymentDefaults,
							creditopinion__: rawData.creditOpinion.value,
							creditopinioncurrency__: rawData.creditOpinion.currency,
							lastupdatedate__: rawData.score.lastUpdate,
							thirdpartyid__: rawData.businessId,
							json__: rawData
						}));
						callback(wrapData);
					});
				}

				provider.GetSessionKey(function (isAuthentificated)
				{
					if (!isAuthentificated)
					{
						callback({ error: true, msg: "_Error" });
						return;
					}
					if (!action && company.thirdPartiesIds && company.thirdPartiesIds.crmId)
					{

						GetCompanyData(company.thirdPartiesIds.crmId);
						return;
					}
					provider.GetCompaniesInfos(company, function (business)
					{
						if (business.error)
						{
							callback(business);
							return;
						}

						if (business.needSelection)
						{
							provider.DisplaySelectPopup(function (selectedBusiness)
							{
								if (selectedBusiness.noSelection)
								{
									callback(selectedBusiness);
									return;
								}
								GetCompanyData(selectedBusiness.id);
								ScoringProviders.StoreThirdPartiesId(selectedBusiness.id, "crmId");
							});
							return;
						}

						GetCompanyData(business.id);
						ScoringProviders.StoreThirdPartiesId(business.id, "crmId");
					});
				});
			},
			GetData: function (providerData)
			{
				var scoreData = providerData.scoreData;
				var scoreScale = scoreData.scorescale__.split("-");
				providerData.imgURL = this.imgURL;
				providerData.scale = { min: { val: parseInt(scoreScale[0], 10) }, max: { val: parseInt(scoreScale[1], 10) } };
				providerData.thresholds = [
					{ maxVal: 0, color: "black" },
					{ maxVal: 2, color: "red" },
					{ maxVal: 4, color: "orange" },
					{ maxVal: 6, color: "yellow" },
					{ maxVal: 10, color: "green" }
				];

				var gaugeObject = Tools.BuildGaugeObject(providerData);
				gaugeObject.footer.tiles = Tools.BuildDefaultGaugeTiles(scoreData);
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.CreditRiskMonitor.Interface", scoreData, gaugeObject) || gaugeObject;
			}
		},
		creditsafe: {
			name: "creditsafe",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_creditsafe_logo.png",
			IsAllowed: function () { return true; },
			GetProviderData: Tools.GetDefaultProviderData,
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.CreditSafeClient(credentials);
				function GetCompanyData(id)
				{
					provider.GetCompanyData(id, function (rawData)
					{
						if (rawData.error)
						{
							callback(rawData);
							return;
						}
						company.thirdPartiesIds.creditsafeId = id;
						var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
							score__: rawData.score.value,
							scorescale__: rawData.score.scale,
							lastupdatedate__: rawData.score.lastUpdate,
							thirdpartyid__: rawData.businessId,
							json__: rawData
						}));
						callback(wrapData);
					});
				}

				provider.GetSessionKey(function (isAuthentificated)
				{
					if (!isAuthentificated)
					{
						callback({ error: true, msg: "_Error" });
						return;
					}
					if (!action && company.thirdPartiesIds && company.thirdPartiesIds.creditsafeId)
					{

						GetCompanyData(company.thirdPartiesIds.creditsafeId);
						return;
					}
					provider.GetCompaniesInfos(company, function (business)
					{
						if (business.error)
						{
							callback(business);
							return;
						}

						if (business.needSelection)
						{
							provider.DisplaySelectPopup(function (selectedBusiness)
							{
								if (selectedBusiness.noSelection)
								{
									callback(selectedBusiness);
									return;
								}
								GetCompanyData(selectedBusiness.id);
								ScoringProviders.StoreThirdPartiesId(selectedBusiness.id, "creditsafeId");
							});
							return;
						}

						GetCompanyData(business.id);
						ScoringProviders.StoreThirdPartiesId(business.id, "creditsafeId");
					});
				});
			},
			GetData: function (providerData)
			{
				var scoreData = providerData.scoreData;
				var scoreScale = scoreData.scorescale__.split("-");
				providerData.imgURL = this.imgURL;
				providerData.scale = { min: { val: parseInt(scoreScale[0], 10) }, max: { val: parseInt(scoreScale[1], 10) } };
				providerData.thresholds = [
					{ maxVal: 0, color: "black" },
					{ maxVal: 20, color: "red" },
					{ maxVal: 40, color: "orange" },
					{ maxVal: 60, color: "yellow" },
					{ maxVal: 100, color: "green" }
				];
				var gaugeObject = Tools.BuildGaugeObject(providerData);
				gaugeObject.footer.tiles = [
					{
						title: Language.Translate(overallBusinessRisk, false),
						value: Language.Translate(scoreData.json__.riskCategory, false)
					},
					{
						title: Language.Translate("_dbt", false),
						value: scoreData.json__.dbt
					},
					{
						title: Language.Translate("_CreditLimit", false),
						value: scoreData.json__.creditLimit.value ?
							Lib.CM.CustomerHelper.CurrencyFormat(scoreData.json__.creditLimit.value, scoreData.json__.creditLimit.currency) : "&nbsp;"
					},
					{
						title: Language.Translate(lastUpdate, false),
						value: scoreData.lastupdatedate__ ? Language.FormatDate(new Date(scoreData.lastupdatedate__)) : "&nbsp;"

					}
				];
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.CreditSafe.Interface", scoreData, gaugeObject) || gaugeObject;
			}
		},
		experian: {
			name: "experian",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_experian_logo.png",
			IsAllowed: function () { return true; },
			GetProviderData: function (queryRecord)
			{
				return queryRecord ?
					{
						provider: queryRecord.PROVIDER__,
						credentials: Providers.GetCredentials(queryRecord),
						onViewMoreClick: function ()
						{
							if (ScoringProviders.company && ScoringProviders.company.thirdPartiesIds && ScoringProviders.company.thirdPartiesIds.experianId
								&& ScoringProviders.scoreProviders.experian && ScoringProviders.scoreProviders.experian.credentials)
							{
								Controls.form_header.Wait(true);
								var provider = new Sys.CM.ExperianClient(ScoringProviders.scoreProviders.experian.credentials);
								provider.GetSessionKey(function (isAuthentificated)
								{
									if (isAuthentificated)
									{
										provider.GetB64PdfReport(ScoringProviders.company.thirdPartiesIds.experianId, function (data)
										{
											Lib.Gauge.OpenB64Pdf(data.b64report);
											Controls.form_header.Wait(false);
										});
									}
									else
									{ Controls.form_header.Wait(false); }
								});
							}
							else
							{ Controls.form_header.Wait(false); }
						}
					} : null;
			},
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.ExperianClient(credentials);
				function GetCompanyData(id)
				{
					provider.GetCompanyData(id, function (rawData)
					{
						if (rawData.error)
						{
							callback(rawData);
							return;
						}

						company.thirdPartiesIds.experianId = id;
						var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
							score__: rawData.score.value,
							scorescale__: rawData.score.scale,
							thirdpartyid__: rawData.businessId,
							json__: rawData
						}));
						callback(wrapData);
					});
				}

				provider.GetSessionKey(function (isAuthentificated)
				{
					if (!isAuthentificated)
					{
						callback({ error: true, msg: "_Error" });
						return;
					}
					if (!action && company.thirdPartiesIds && company.thirdPartiesIds.experianId)
					{

						GetCompanyData(company.thirdPartiesIds.experianId);
						return;
					}
					provider.GetCompaniesInfos(company, function (business)
					{
						if (business.error)
						{
							callback(business);
							return;
						}

						if (business.needSelection)
						{
							provider.DisplaySelectPopup(function (selectedBusiness)
							{
								if (selectedBusiness.noSelection)
								{
									callback(selectedBusiness);
									return;
								}
								GetCompanyData(selectedBusiness.id);
								ScoringProviders.StoreThirdPartiesId(selectedBusiness.id, "experianId");
							});
							return;
						}

						GetCompanyData(business.id);
						ScoringProviders.StoreThirdPartiesId(business.id, "experianId");
					});
				});
			},
			GetData: function (providerData)
			{
				function getYIB(YIBIndicator)
				{
					switch (YIBIndicator)
					{
						case "A": return Language.Translate("_Under 1 year", false);
						case "B": return Language.Translate("_1 year", false);
						case "C": return Language.Translate("_2 years", false);
						case "D": return Language.Translate("_3 to 5 years", false);
						case "E": return Language.Translate("_6 to 10 years", false);
						case "F": return Language.Translate("_Over 10 year", false);
						default: return "&nbsp;";
					}
				}

				function getRisk(riskClass)
				{
					switch (riskClass)
					{
						case "1": return Language.Translate("_RiskLow", false);
						case "2": return Language.Translate("_RiskModerate", false);
						case "3": return Language.Translate("_RiskMedium", false);
						case "4": return Language.Translate("_RiskHigh", false);
						case "5": return Language.Translate("_RiskExtreme", false);
						case "998": return Language.Translate("_RiskOutOfBusiness", false);
						case "999": return Language.Translate("_Insufficient data to score", false);
						default: return Language.Translate("_RiskNone", false);
					}
				}

				var riskIndicator = { "1": "favourable", "4": "alert" };

				var scoreData = providerData.scoreData;
				var scoreScale = scoreData.scorescale__.split("-");

				providerData.imgURL = this.imgURL;
				providerData.scale = { min: { val: parseInt(scoreScale[0], 10) }, max: { val: parseInt(scoreScale[1], 10) } };
				providerData.thresholds = [
					{ maxVal: 0, color: "black" },
					{ maxVal: 20, color: "red" },
					{ maxVal: 40, color: "orange" },
					{ maxVal: 60, color: "yellow" },
					{ maxVal: 100, color: "green" }
				];

				var gaugeObject = Tools.BuildGaugeObject(providerData);
				gaugeObject.footer.tiles = [
					{
						title: Language.Translate(overallBusinessRisk, false),
						value: getRisk(scoreData.json__.riskClass.toString()),
						indicator: riskIndicator[scoreData.json__.riskClass.toString()]
					},
					{
						title: Language.Translate("_dbt", false),
						value: scoreData.json__.dbt || "&nbsp"
					},
					{
						title: Language.Translate("_CreditLimit", false),
						value: scoreData.json__.creditLimit.value ?
							Lib.CM.CustomerHelper.CurrencyFormat(scoreData.json__.creditLimit.value, scoreData.json__.creditLimit.currency) : "&nbsp;"
					},
					{
						title: Language.Translate("_Age of business", false),
						value: scoreData.json__.yearsInBusiness || getYIB(scoreData.json__.yearsInBusinessIndicator)
					}
				];
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.Experian.Interface", scoreData, gaugeObject) || gaugeObject;
			}
		},
		creditorwatch: {
			mapping: ["F", "E", "D3", "D2", "D1", "C3", "C2", "C1", "B3", "B2", "B1", "A3", "A2", "A1"],
			name: "creditorwatch",
			storageAllowed: true,
			imgURL: "public\\creditScoreProvider_creditorwatch_logo.png",
			IsAllowed: function () { return Data.GetValue("ABN__"); },
			GetProviderData: Tools.GetDefaultProviderData,
			RequestData: function (company, credentials, action, callback)
			{
				var that = this;
				var provider = new Sys.CM.CreditorWatchClient(credentials);
				function GetCompanyData(args)
				{
					provider.GetCompanyData(args.companyId, function (rawData)
					{
						if (rawData.error)
						{
							callback(rawData);
							return;
						}
						ScoringProviders.StoreThirdPartiesId(args.companyId, "creditorwatchId");
						var wrapData = that.GetData(ScoringProviders.UpdateScoreData(that, {
							score__: rawData.score.value,
							scorescale__: rawData.score.scale,
							lastupdatedate__: rawData.score.lastUpdate,
							thirdpartyid__: rawData.businessId,
							json__: rawData
						}));
						callback(wrapData);
					});
				}

				provider.GetSessionKey(function (isAuthentificated)
				{
					if (!isAuthentificated)
					{
						callback({ error: true, msg: "_Error" });
					}
					else if (Data.GetValue("ABN__"))
					{
						GetCompanyData({ companyId: Data.GetValue("ABN__") });
					}
					else if (!action && company.thirdPartiesIds && company.thirdPartiesIds.creditorwatchId)
					{
						GetCompanyData({ companyId: company.thirdPartiesIds.creditorwatchId });
					}
					else
					{
						callback({ error: true, msg: "_Error" });
					}
				});
			},
			GetData: function (providerData)
			{
				var scoreData = providerData.scoreData;
				var scoreScale = scoreData.scorescale__.split("-");
				providerData.imgURL = this.imgURL;
				providerData.scale = { min: { val: 0, displayVal: scoreScale[0] }, max: { val: 13, displayVal: scoreScale[1] } };
				providerData.thresholds = [
					{ maxVal: "0", color: "black" },
					{ maxVal: "3", color: "red" },
					{ maxVal: "7", color: "orange" },
					{ maxVal: "10", color: "yellow" },
					{ maxVal: "14", color: "green" }
				];
				var gaugeObject = {
					logoPath: Process.GetImageURL(providerData.imgURL),
					gauge: {
						value: scoreData.score__ ? this.mapping.indexOf(scoreData.score__) : 0,
						scoreName: scoreData.json__.scoreName,
						displayedValue: scoreData.score__,
						variation: scoreData.trend__ === "up" || scoreData.trend__ === "down" ? scoreData.trend__ : "none",
						scale: providerData.scale,
						thresholds: providerData.thresholds
					},
					footer: {
						editLink: {
							hidden: scoreData.json__.isDemoScore === "true",
							label: Language.Translate("_Edit", false)
						},
						viewMoreLink: {
							hidden: scoreData.json__.isDemoScore === "true",
							label: Language.Translate("_More", false),
							url: providerData.homePageUrl,
							onClick: providerData.onViewMoreClick
						},
						alerts: Tools.AddAlertTile(providerData.scoreData)
					}
				};
				gaugeObject.footer.tiles = [
					{
						title: Language.Translate("_paymentRange", false),
						value: scoreData.json__.paymentRange ? scoreData.json__.paymentRange : "&nbsp;"
					},
					{
						title: Language.Translate("_predictedDaysToPay", false),
						value: scoreData.json__.predictedDaysToPay ? scoreData.json__.predictedDaysToPay : "&nbsp;"
					},
					{
						title: Language.Translate("_maxCreditExposure", false),
						value: (scoreData.json__.maxCreditExposure && scoreData.json__.maxCreditExposure.value) ?
							Lib.CM.CustomerHelper.CurrencyFormat(scoreData.json__.maxCreditExposure.value, scoreData.json__.maxCreditExposure.currency) : "&nbsp;"
					},
					{
						title: Language.Translate(lastUpdate, false),
						value: scoreData.lastupdatedate__ ? Language.FormatDate(new Date(scoreData.lastupdatedate__)) : "&nbsp;"

					}
				];
				return Sys.Helpers.TryCallFunction("Lib.CM.Customization.CreditScore.CreditorWatch.Interface", scoreData, gaugeObject) || gaugeObject;
			}
		}
	};

	function DisplayGauge(scoreProviders)
	{
		for (var provider in scoreProviders)
		{
			if (Providers[provider])
			{
				if (scoreProviders[provider].scoreData)
				{
					var immediateData = Providers[provider].GetData(scoreProviders[provider]);
					immediateData.providerData = scoreProviders[provider];
					immediateData.name = provider + "_" + scoreProviders[provider].scoreData.msn;
					Lib.Gauge.AddGauge(immediateData);
				}
				else
				{
					var delayedData = Tools.GetDelayedData(Providers[provider].imgURL);
					delayedData.providerData = scoreProviders[provider];
					delayedData.name = provider + "_delayed";
					Lib.Gauge.AddDelayedGauge(delayedData);
				}
			}
		}
		var customGauge = Sys.Helpers.TryGetFunction("Lib.CM.Customization.Gauge.AddCustomGauge");
		Sys.Helpers.TryCallFunction("Lib.CM.Customization.Gauge.AddCustomGauge", ScoringProviders);
		if (!ScoringProviders.hasProviders && !ScoringProviders.hasScores && !customGauge)
		{
			Lib.Gauge.SetError("_Error");
		}
	}

	var ScoringProviders = {
		Init: function (containerCtrl)
		{
			Lib.Gauge.Init(containerCtrl);
			Lib.Gauge.OnRefresh = function (data, resolveCB)
			{
				if (!data.providerData)
				{
					Sys.Helpers.TryCallFunction("Lib.CM.Customization.Gauge.OnRefreshCustomGauge", ScoringProviders, data, resolveCB);
				}
				if (ScoringProviders.company && data.providerData && data.providerData.provider)
				{
					Providers[data.providerData.provider].RequestData(ScoringProviders.company, data.providerData.credentials, data.action, function (gaugeData)
					{
						ScoringProviders.StoreScore(gaugeData, data, resolveCB);
					});
				}
			};
		},
		StoreScore: function (gaugeData, data, resolveCB)
		{
			if (!gaugeData.error && Providers[data.providerData.provider].storageAllowed)
			{
				Lib.CM.CreditScoreCLient.Store(ScoringProviders, data.providerData, function (storeData)
				{
					if (!storeData.error && data.providerData.provider !== "creditorwatch")
					{
						ScoringProviders.EnabledCreditScore();
					}
				});
			}

			resolveCB(gaugeData);
		},
		UpdateScoreData: function (providerDef, scoreData)
		{
			if (ScoringProviders.scoreProviders[providerDef.name])
			{
				ScoringProviders.scoreProviders[providerDef.name].scoreData = scoreData;
				return ScoringProviders.scoreProviders[providerDef.name];
			}

			return null;
		},
		GetScoreProviderCallBack: function (queryResult)
		{
			var recordCount = queryResult.GetRecordsCount();
			ScoringProviders.hasProviders = recordCount > 0 && !queryResult.GetQueryError();

			if (ScoringProviders.hasProviders)
			{
				for (var i = 0; i < recordCount; i++)
				{
					var providerId = queryResult.GetQueryValue("Provider__", i).toLowerCase();
					if (Providers[providerId] && Providers[providerId].IsAllowed(queryResult, i))
					{
						ScoringProviders.scoreProviders[providerId] = Providers[providerId].GetProviderData(Tools.GetQueryRecord(queryResult, i));
					}
				}
			}

		},
		GetScoreDataCallBack: function (queryResult)
		{
			var attributes = queryResult.GetQueryValue().RecordsDefinition;
			var recordCount = queryResult.GetRecordsCount();
			ScoringProviders.hasScores = recordCount > 0 && !queryResult.GetQueryError();
			for (var i = 0; i < recordCount; i++)
			{
				var scoreData = {};
				for (var attr in attributes)
				{
					scoreData[attr.toLowerCase()] = attr.toLowerCase() === "json__" && !Sys.Helpers.IsEmpty(queryResult.GetQueryValue(attr, i)) ?
						JSON.parse(queryResult.GetQueryValue(attr, i)) :
						queryResult.GetQueryValue(attr, i);
				}

				if (scoreData.provider__ !== "creditriskmonitor" || ScoringProviders.scoreProviders[scoreData.provider__])
				{
					ScoringProviders.scoreProviders[scoreData.provider__] = ScoringProviders.scoreProviders[scoreData.provider__] || {};
					ScoringProviders.scoreProviders[scoreData.provider__].previousScoreRuid = scoreData.ruidex;
					ScoringProviders.scoreProviders[scoreData.provider__].scoreData = scoreData;
				}
			}
			DisplayGauge(ScoringProviders.scoreProviders);
		},
		OnStart: function (args)
		{
			ScoringProviders.company = args.company;
			ScoringProviders.scoreProviders = {};
			ScoringProviders.StoreThirdPartiesId = args.StoreThirdPartiesId || function () { /**/ };
			ScoringProviders.EnabledCreditScore = args.EnabledCreditScore || function () { /**/ };
			Query.DBQuery(function ()
			{
				ScoringProviders.GetScoreProviderCallBack(this);

				Query.DBQuery(
					function () { ScoringProviders.GetScoreDataCallBack(this); },
					"CM - Credit score__",
					"",
					"Identifier__=" + ScoringProviders.company.scoreId,
					"",
					"no_limit"
				);
			},
			"CM - Application Settings__",
			"Provider__|ContractId__|UserId__|Password__|UserLogin__|ClientId__|ClientSecret__|Subcode__|CreditRatingHomePage__",
			"longId=*",
			"",
			"no_limit");
		}
	};

	return ScoringProviders;
})();
