/* LIB_DEFINITION{
  "name": "Lib_Gauge_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "Sys/Sys_Portal"
  ]
}*/

var Lib = Lib || {};

Lib.Gauge = (function ()
{
	function refreshScore(data, gaugeData, container)
	{
		if (gaugeData.error)
		{
			data.msg = Language.Translate(gaugeData.msg, false);
			data.error = gaugeData.error;
			container.FireEvent("onSetError", { data: data, noScore: gaugeData.noScore });
		}
		else if (gaugeData.noSelection)
		{
			data.noSelection = gaugeData.noSelection;
			container.FireEvent("onNoSelection", { data: data });
		}
		else
		{
			gaugeData.name = data.name;
			gaugeData.providerData = data.providerData;
			data = gaugeData;
			container.FireEvent("onRefreshGauge", { data: data });
		}
	}

	var GaugeType = {

		Immediate: function (container, data)
		{
			this._data = data;
			this.Refresh = function (action)
			{
				var that = this;
				this._data.action = action;
				Lib.Gauge.OnRefresh(this._data, function (gaugeData)
				{
					refreshScore(that._data, gaugeData, container);
				});
			};
			container.FireEvent("onAddGauge", { data: this._data });
		},
		Delayed: function (container, data)
		{
			this._data = data;
			this._data.isDelayed = true;
			this.Refresh = function (action)
			{
				var that = this;
				this._data.action = action;
				Lib.Gauge.OnRefresh(this._data, function (gaugeData)
				{
					refreshScore(that._data, gaugeData, container);
				});
			};

			container.FireEvent("onAddGauge", { data: this._data });
			if (this._data.directLoad)
			{
				this.Refresh();
			}
		}
	};

	var GaugeContainer = {
		_gauges: {},
		SetError: function (rawError)
		{
			GaugeContainer.control.FireEvent("onSetError", { error: Language.Translate(rawError, false) });
		},
		Init: function (containerCtrl)
		{
			GaugeContainer.control = containerCtrl;
			containerCtrl.BindEvent("onLoad", function ()
			{
				GaugeContainer.control.FireEvent("onLoadGaugeContainer", { imgElemHtml: Sys.Portal.GetFieldsLoaderHtmlContent() });
			});

			containerCtrl.BindEvent("OnRefreshClick", function (evt)
			{
				GaugeContainer.RefreshGauge(evt.gaugeId, evt.action);
			});

			containerCtrl.BindEvent("onDelayLoadClick", function (evt)
			{
				GaugeContainer.RefreshGauge(evt.gaugeId);
			});
		},
		AddGauge: function (data)
		{
			GaugeContainer._gauges[data.name] = new GaugeType.Immediate(GaugeContainer.control, data);
		},
		AddDelayedGauge: function (data)
		{
			data.loadLabel = Language.Translate("_Load gauge", false);
			GaugeContainer._gauges[data.name] = new GaugeType.Delayed(GaugeContainer.control, data);
		},
		RefreshGauge: function (gaugeId, action)
		{
			GaugeContainer._gauges[gaugeId].Refresh(action);
		},
		OpenB64Pdf: function (b64PdfData)
		{
			GaugeContainer.control.FireEvent("onOpenB64Pdf", { b64PdfData: b64PdfData });
		}
	};

	return GaugeContainer;
})();