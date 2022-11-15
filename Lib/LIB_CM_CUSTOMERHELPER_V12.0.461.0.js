/* LIB_DEFINITION{
  "name": "Lib_CM_CustomerHelper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Shared functions between Customer_Extended_Delivery_Properties__ and CM - Credit Application",
  "require": [
    "Sys/Sys_AR_Client"
  ]
}*/

var Lib = Lib || {};
Lib.CM = Lib.CM || {};

Lib.CM.CustomerHelper = (function ()
{
	function QueryImportOrdersTable(args)
	{
		Query.DBQuery(function ()
		{
			var err = this.GetQueryError();
			if (!err && this.GetQueryValue().Records.length > 0)
			{
				Lib.CM.CustomerHelper._TotalExposureResult.pendingOrdersAmount = parseFloat(this.GetQueryValue("SUM"));
				Lib.CM.CustomerHelper._TotalExposureResult.nbPendingOrders = parseFloat(this.GetQueryValue("COUNT"));
				Lib.CM.CustomerHelper._TotalExposureResult.totalExposure =
					Lib.CM.CustomerHelper._TotalExposureResult.totalReceivablesAmount + Lib.CM.CustomerHelper._TotalExposureResult.pendingOrdersAmount;
				args.callback(Lib.CM.CustomerHelper._TotalExposureResult);
			}
			else
			{
				Lib.CM.CustomerHelper._TotalExposureResult.error = true;
				args.callback(Lib.CM.CustomerHelper._TotalExposureResult);
			}
		}, "CM - Orders Import__", "__SUMCOUNT__:Order_Total__|__CURRENCY__:Currency__", "(&(CustomerNumber__=" + args.customerId + "))", null, 100);
	}

	return {
		GetHistoricalData: function (args)
		{
			if (!args || typeof args.callback !== "function")
			{
				return;
			}

			if (!args.customerId)
			{
				args.callback({ error: true });
				return;
			}

			var lastMonth = Sys.Helpers.Date.Date2DBDate(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
			var customerFilter = "(&(Date__<=" + lastMonth + ")(Customer_ID__=" + args.customerId + "))";

			Query.DBQuery(function ()
			{
				var abscissa = [];
				var values = { overdue: {}, outstanding: {}, creditLimit: {} };
				var nbRecords = this.GetRecordsCount();
				for (var i = 0; i < nbRecords; i++)
				{
					var abscissaSettings = { month: 'short', year: '2-digit' };
					var x = new Date(this.GetQueryValue("date__", i)).toLocaleDateString(User.culture, abscissaSettings);
					abscissa.push(x);
					values.overdue[x] = parseFloat(this.GetQueryValue("overdue__", i));
					values.outstanding[x] = parseFloat(this.GetQueryValue("outstanding__", i));
					values.creditLimit[x] = parseFloat(this.GetQueryValue("credit_Limit__", i));
				}

				args.callback({
					type: Controls.Historic__.Types.VBarStacked,
					xAxis: { values: abscissa },
					yAxis: {},
					legend: true,
					series: [
						{
							name: Language.Translate("_CreditLimit"),
							type: Controls.Historic__.Types.Line,
							colorIndex: 2,
							values: values.creditLimit
						},
						{
							name: Language.Translate("_Outstanding"),
							type: Controls.Historic__.Types.VBarStacked,
							colorIndex: 1,
							dataLabelsColorIndex: 1,
							dataLabelsFormatter: Lib.CM.CustomerHelper.CurrencyFormat,
							values: values.outstanding
						},
						{
							name: Language.Translate("_historicalOverdue"),
							type: Controls.Historic__.Types.VBarStacked,
							colorIndex: 3,
							dataLabelsColorIndex: 3,
							dataLabelsFormatter: Lib.CM.CustomerHelper.CurrencyFormat,
							values: values.overdue
						}
					]
				});
			}, "O2C - Historical Data__", null, customerFilter, "Date__ ASC", 100);
		},

		GetTotalExposure: function (args)
		{
			if (!args || typeof args.callback !== "function")
			{ return; }

			if (!args.customerId)
			{
				args.callback({ error: true });
				return;
			}
			Lib.CM.CustomerHelper._TotalExposureResult = {};

			Lib.CM.CustomerHelper._insuranceAmount = args.insuranceAmount;
			Query.DBQuery(
				function ()
				{
					var err = this.GetQueryError();
					if (!err && this.GetQueryValue().Records.length > 0)
					{
						Lib.CM.CustomerHelper._TotalExposureResult.currency = this.GetQueryValue("CURRENCY");
						Lib.CM.CustomerHelper._TotalExposureResult.totalReceivablesAmount = parseFloat(this.GetQueryValue("SUM"));
						Lib.CM.CustomerHelper._TotalExposureResult.nbReceivablesInvoices = parseFloat(this.GetQueryValue("COUNT"));
						if (Sys.AR.GetParameter("EnableCreditApplication"))
						{
							QueryImportOrdersTable(args);
						}
						else
						{
							args.callback(Lib.CM.CustomerHelper._TotalExposureResult);
						}
					}
					else
					{
						Lib.CM.CustomerHelper._TotalExposureResult.error = true;
						args.callback(Lib.CM.CustomerHelper._TotalExposureResult);
					}
				},
				"CDNAME#Customer invoices (supplier copy)",
				"__SUMCOUNT__:Invoice_local_outstanding_amount__|__CURRENCY__:Invoice_local_currency__",
				"(&(Customer_ID__=" + args.customerId + ")(Payment_status__!=paid)(Invoice_local_outstanding_amount__!=0)(State <= 200)(deleted=0)(priority!=0))",
				null,
				"no_limit"
			);
		},

		CheckCreditLimitUtilization: function (args)
		{
			if (!args || typeof args.callback !== "function")
			{ return; }

			if (!args.customerId || !args.creditLimit)
			{
				args.callback({ error: true });
				return;
			}
			if (typeof args.creditLimit !== "number")
			{
				args.creditLimit = parseFloat(args.creditLimit);
				if (isNaN(args.creditLimit) && !args.creditLimit)
				{
					args.callback({ error: true });
					return;
				}
			}

			var sumReceivablesAmount = 0;

			var promise = Sys.Helpers.Promise.Create(function(resolve, reject)
			{
				Query.DBQuery(function ()
				{
				var err = this.GetQueryError();
				if (!err)
				{
					if (this.GetQueryValue().Records.length > 0)
					{
						sumReceivablesAmount = parseFloat(this.GetQueryValue("__SUM__:Order_Total__"));
					}
					resolve();
				}
				else
				{
					reject("error");
				}

				}, "CM - Orders Import__", "__SUM__:Order_Total__", "(&(CustomerNumber__=" + args.customerId + "))", null, 100);
			});

			var result = { creditLimit: args.creditLimit };
			promise.Then(function ()
			{
				Query.DBQuery(
				function ()
				{
					var err = this.GetQueryError();
					if (!err && this.GetQueryValue().Records.length > 0)
					{
						result.outstanding = parseFloat(this.GetQueryValue("__SUM__:Invoice_local_outstanding_amount__"));
						result.outstanding  = result.outstanding  + sumReceivablesAmount;
						args.callback(result);
					}
					else
					{
						result.error = true;
						args.callback(result);
					}
				},
				"CDNAME#Customer invoices (supplier copy)",
				"__SUM__:Invoice_local_outstanding_amount__",
				"(&(Customer_ID__=" + args.customerId + ")(Invoice_local_outstanding_amount__!=0)(State<=200)(deleted=0)(priority!=0))",
				null,
				"no_limit"
				);
			});
		},

		CurrencyFormat: function (value, currency)
		{
			var options = {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			};
			currency = currency || Data.GetValue("Currency__");
			if (currency && value !== 0)
			{
				options.style = 'currency';
				options.currency = currency.toUpperCase();
			}
			var formatter = new Intl.NumberFormat(User.culture, options);
			//123 is only used to be replaced later
			var formattedCurrency = formatter.format(123);
			var shortenedFormat = Language.FormatNumber(value, {
				shorten: true,
				shortenedFormat: Language.NumberShortenedFormats.auto
			});
			return formattedCurrency.replace("123", shortenedFormat);
		},

		GetPayerRatingLevel: function (payerRating)
		{
			var stars;
			switch (payerRating)
			{
				case "excellent":
					stars = 4;
					break;
				case "good":
					stars = 3;
					break;
				case "fair":
					stars = 2;
					break;
				case "poor":
					stars = 1;
					break;
				default:
					stars = null;
			}
			return { stars: stars };
		},

		SetCountersValue: function (data)
		{
			if (data.error)
			{
				Controls.TotalOutstanding__.SetError("_Error");
				Controls.ImportedOrderCounter__.SetError("_Error");
				Controls.TotalExposure__.SetError("_Error");
				return;
			}

			Controls.TotalOutstanding__.SetValue({
				value: Lib.CM.CustomerHelper.CurrencyFormat(data.totalReceivablesAmount, data.currency),
				subValue: Language.Translate("_Total receivables ({0})", true, data.nbReceivablesInvoices)
			});

			Controls.ImportedOrderCounter__.SetValue({
				value: Lib.CM.CustomerHelper.CurrencyFormat(data.pendingOrdersAmount, data.currency),
				subValue: Language.Translate("_Uninvoiced orders ({0})", true, data.nbPendingOrders)
			});

			Controls.TotalExposure__.SetValue({
				value: Lib.CM.CustomerHelper.CurrencyFormat(data.totalExposure, data.currency)
			});
			var percent = 0;
			if (data.totalExposure > Lib.CM.CustomerHelper._insuranceAmount && Lib.CM.CustomerHelper._insuranceAmount !== 0)
			{
				percent = Math.round((data.totalExposure - Lib.CM.CustomerHelper._insuranceAmount) / Lib.CM.CustomerHelper._insuranceAmount * 100);
				Controls.InsuranceAmountCounter__.SetValue({
					value: Lib.CM.CustomerHelper.CurrencyFormat(Lib.CM.CustomerHelper._insuranceAmount),
					subText: Language.Translate("_{0}PercentOverInsuredLimit", false, percent)
				});
				Controls.InsuranceAmountCounter__.SetColor({ color: "#D8262E" });
				Controls.InsurancePane.SetProgressBar({
					value: data.totalExposure,
					max: Lib.CM.CustomerHelper._insuranceAmount,
					color: "#D8262E",
					label: Language.Translate("_{0}OverInsuredLimit", false, Lib.CM.CustomerHelper.CurrencyFormat(data.totalExposure - Lib.CM.CustomerHelper._insuranceAmount))
				});
			}
			else if (Lib.CM.CustomerHelper._insuranceAmount !== 0)
			{
				percent = Math.round(data.totalExposure / Lib.CM.CustomerHelper._insuranceAmount * 100);
				Controls.InsuranceAmountCounter__.SetValue({
					value: Lib.CM.CustomerHelper.CurrencyFormat(Lib.CM.CustomerHelper._insuranceAmount),
					subText: Language.Translate("_{0}PercentUsed", false, percent)
				});
				Controls.InsurancePane.SetProgressBar({
					value: data.totalExposure,
					max: Lib.CM.CustomerHelper._insuranceAmount,
					labels: {
						left: Lib.CM.CustomerHelper.CurrencyFormat(data.totalExposure),
						right: Lib.CM.CustomerHelper.CurrencyFormat(Lib.CM.CustomerHelper._insuranceAmount - data.totalExposure)
					}
				});
			}
			else
			{
				Controls.InsuranceAmountCounter__.SetValue({
					value: Lib.CM.CustomerHelper.CurrencyFormat(Lib.CM.CustomerHelper._insuranceAmount)
				});
			}
		},
		DisplayPayerRating: function (rating)
		{
			if (rating === "unknown" || !rating)
			{
				Controls.PayerRatingHTML__.FireEvent("onDisplayPayerRating", {});
				Controls.PayerRatingDescription__.SetText("_NotEnoughDataTermSync");
				Controls.PayerRatingDescription__.SetTextSize(Controls.PayerRatingDescription__.Sizes.Small);
				Controls.PayerRatingDescription__.Hide(false);
			}
			else
			{
				Controls.PayerRatingHTML__.FireEvent("onDisplayPayerRating", Lib.CM.CustomerHelper.GetPayerRatingLevel(rating));
				Controls.PayerRatingDescription__.SetText(rating);
				Controls.PayerRatingDescription__.Hide(false);
			}
		},
		DisplayADP: function (value)
		{
			if (value != undefined)
			{
				Controls.ADPCounter__.SetValue({ value: value });
			}
			else
			{
				Controls.ADPCounter__.Hide(true);
				Controls.ADPNoData__.Hide(false);
			}
		},
		SetRiskCategoryProgressBar: function (value)
		{
			var translatedValue = "";
			var color = "";
			switch (value)
			{
				case "0":
					translatedValue = Language.Translate("_RiskVeryLow");
					color = "veryLow";
					break;
				case "1":
					translatedValue = Language.Translate("_RiskLow");
					color = "low";
					break;
				case "2":
					translatedValue = Language.Translate("_RiskModerate");
					color = "moderate";
					break;
				case "3":
					translatedValue = Language.Translate("_RiskMedium");
					color = "medium";
					break;
				case "4":
					translatedValue = Language.Translate("_RiskHigh");
					color = "high";
					break;
				case "5":
					translatedValue = Language.Translate("_RiskExtreme");
					color = "extreme";
					break;
				case "6":
					translatedValue = Language.Translate("_RiskOutOfBusiness");
					color = "outofbusiness";
					break;
				default:
					translatedValue = Language.Translate("_RiskNone");
					color = "none";
			}

			if (value)
			{
				Controls.RiskCategoryPane.SetStateBar({
					cursorPosition: parseInt(value, 10),
					states: [
						{ color: "#5EAD25" },
						{ color: "#3FBFAD" },
						{ color: "#F9BE00" },
						{ color: "#FF8700" },
						{ color: "#D92530" },
						{ color: "#943838" },
						{ color: "#1A2732" }
					]
				});
			}
			return { color: color, translatedValue: translatedValue };
		}
	};
})();
