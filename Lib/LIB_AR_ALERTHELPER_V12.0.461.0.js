/* LIB_DEFINITION{
  "name": "Lib_AR_AlertHelper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Handling Alerts in various processes",
  "require": [
    "Sys/Sys_AR_Client"
  ]
}*/

var Lib = Lib || {};
Lib.AR = Lib.AR || {};
Lib.AR.AlertHelper =
{
		AlertHandler: function (args)
		{
			var containerInitialized = false;
			var alertsQueue = [];
			var nbAlerts = 0;

			args.container.BindEvent("onLoad", function ()
			{
				containerInitialized = true;
				for (var i = 0; i < alertsQueue.length; i++)
				{
					$AddAlert(alertsQueue[i]);
				}

				alertsQueue = null;
			});

			function $AddAlert(alert)
			{
				args.pane.Hide(false);
				args.container.Hide(false);
				args.container.FireEvent("onHideAlert", { id: alert.id });
				args.container.FireEvent("onDisplayAlert", alert);
				nbAlerts++;
				$OnAlertsChange();
			}

			function $OnAlertsChange()
			{
				if (typeof args.onAlertsChange === "function")
				{
					args.onAlertsChange(nbAlerts);
				}
			}

			return {
				AddAlert: function (alert)
				{
					if (containerInitialized)
					{
						$AddAlert(alert);
					}
					else
					{
						alertsQueue.push(alert);
					}
				},
				HideDetailsBtn: function (alertId, hide)
				{
					args.container.FireEvent("onAlertSetdetailsBtnVisibility", { id: alertId, show: !hide });
				},
				RemoveAlert: function (alertId)
				{
					if (nbAlerts > 0)
					{
						args.container.FireEvent("onHideAlert", { id: alertId });
						nbAlerts--;
					}
					if (!nbAlerts)
					{
						args.pane.Hide(true);
					}

					$OnAlertsChange();
				}
			};
		}
};