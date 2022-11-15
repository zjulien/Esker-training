/* LIB_DEFINITION{
  "name": "Lib_CM_CreditScoreClient_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "Sys/Sys_Helpers"
  ]
}*/

var Lib = Lib || {};
Lib.CM = Lib.CM || {};

Lib.CM.CreditScoreCLient = (function ()
{
	var tableName = "CM - Credit score__";
	return {
		Store: function (scoringProviders, providerData, callback)
		{
			if (!providerData || !providerData.provider || !providerData.scoreData)
			{
				callback({ error: true });
				return;
			}

			var previousScoreRuid = providerData.previousScoreRuid;
			var ctData = Sys.Helpers.Clone(providerData.scoreData);
			ctData.provider__ = providerData.provider;
			ctData.identifier__ = scoringProviders.company.scoreId;
			ctData.json__ = typeof ctData.json__ === "object" ? JSON.stringify(ctData.json__) : ctData.json__;
			delete ctData.previousScoreRuid;

			if (previousScoreRuid)
			{
				Process.UpdateRecord(function (updateError)
				{
					if (typeof callback === "function")
					{
						callback({ error: !!updateError, isUpdate: true });
					}
				}, ctData,	previousScoreRuid);
			}
			else
			{
				Process.CreateTableRecord(tableName, ctData, {
					callback: function (xhrData)
					{
						if (xhrData.ruid)
						{
							providerData.previousScoreRuid = xhrData.ruid;
						}

						if (typeof callback === "function")
						{
							callback({ error: xhrData.error, isUpdate: false });
						}
					}
				});
			}
		}
	};
})();
