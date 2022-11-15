/* LIB_DEFINITION{
  "name": "Lib_O2C_Audit_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date"
  ]
}*/

var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};

Lib.O2C.Audit = (function ()
{
	var AUDIT_TABLE = "O2C - Audit__";
	var _isServer = Sys.ScriptInfo.IsServer();

	function _getTableData(auditData)
	{
		var tableData = {
			"CompanyID__": auditData.companyId,
			"DateTime__": Sys.Helpers.Date.Date2DBDateTime(new Date()),
			"EventID__": auditData.eventId,
			"NewValue__": auditData.newValue || "",
			"OldValue__": auditData.oldValue || "",
			"PackageID__": auditData.packageId,
			"User__": auditData.user,
			"Comments__": auditData.comments || ""
		};

		if (!auditData.user)
		{
			tableData.User__ = _isServer ?
				Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerId")).GetValue("Login") :
				Sys.Helpers.Globals.User.loginId;
		}

		return tableData;
	}

	return {
		Events: {
			UpdatedCreditLimit: "UpdatedCreditLimit",
			DismissCreditAgenciesAlerts: "DismissCreditAgenciesAlerts",
			DismissOutstandingAlerts: "DismissOutstandingAlerts"
		},
		Add: function (auditData)
		{
			if (!auditData || !auditData.companyId || !auditData.eventId || !auditData.packageId)
			{
				return false;
			}

			if (_isServer)
			{
				var tableData = _getTableData(auditData);
				var auditRecord = Process.CreateTableRecord(AUDIT_TABLE);
				var vars = auditRecord.GetVars();
				for (var t in tableData)
				{
					vars.AddValue_String(t, tableData[t], true);
				}

				auditRecord.Commit();
				return auditRecord.GetLastError() === 0;
			}
			return Process.CreateTableRecord(AUDIT_TABLE, _getTableData(auditData));
		}
	};
})();
