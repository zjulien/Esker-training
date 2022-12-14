// This process is generic for AP scheduled task reminders
/** *************** **/
/** MAPPING **/
/** *************** **/
var ReminderMapping = {};
ReminderMapping.paymentApproval = {
	"template": "AP-ReminderForPayment1000_en.htm",
	"trads":
	{
		"tradKeySingleItem": "_Invoice pending approval",
		"tradKeyMultiItem": "_Invoices pending approval"
	},
	"viewNameUrl": "/View.link?tabName=_My%20documents-AP_SAP&viewName=_AP_View%20-%20Assigned%20to%20me",
	"fromName": "Esker Accounts payable",
	"query":
	{
		"processName": "Vendor invoice",
		"filter": "(&(InvoiceStatus__=To approve)(InvoiceAmount__>=1000)(State=70))",
		"includeDnValidate": true
	}
};
ReminderMapping.vendorRegistrationApproval = {
	"template": "AP-ReminderForVendorRegistrationApproval.htm",
	"trads":
	{
		"tradKeySingleItem": "_Vendor registration pending approval",
		"tradKeyMultiItem": "_Vendor registrations pending approval"
	},
	"viewNameUrl": "/View.link?tabName=_Vendor%20registration&viewName=_Vendor%20registration%20-%20ToValidate",
	"fromName": "Esker Vendor management",
	"query":
	{
		"processName": "Vendor Registration",
		"filter": "(&(ProcessStatus__=ToValidate)(State=70))",
		"includeDnValidate": false
	}
};
ReminderMapping.defaultReminder = ReminderMapping.paymentApproval;
/** *************** **/
/** CONTROL HELPERS **/
/** *************** **/
var EmailNotificationCtrl = {
	GetSubject: function (count)
	{
		if (count > 1)
		{
			return {
				key: ReminderMapping[scheduleName].trads.tradKeyMultiItem,
				parameters: [count]
			};
		}
		return {
			key: ReminderMapping[scheduleName].trads.tradKeySingleItem
		};
	},
	GetCustomTags: function (count, approver)
	{
		var baseUrl = Data.GetValue("ValidationUrl");
		baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
		var SSO_URL = Sys.Parameters.GetInstance("P2P").GetParameter("SSO_URL", null);
		var viewName = ReminderMapping[scheduleName].viewNameUrl;
		var validationURL = baseUrl + viewName;
		if (!Sys.Helpers.IsEmpty(SSO_URL))
		{
			var decodeViewName = decodeURIComponent(viewName);
			validationURL = SSO_URL + "&ReturnURL=" + encodeURIComponent(baseUrl) + encodeURIComponent(decodeViewName);
		}
		var customTags = {
			ApproverDisplayName: approver.GetValue("DisplayName"),
			ValidationUrl: validationURL,
			NumberOfInvoice: count,
			NumberOfItems: count
		};
		if (count > 1)
		{
			customTags.PlurialItems = "true";
			customTags.PlurialInvoices = "true";
		}
		return customTags;
	},
	NotifyApprover: function (login, count)
	{
		var approver = Users.GetUser(login);
		if (approver)
		{
			var approverLanguage = approver.GetValue("Language");
			var email = Sys.EmailNotification.CreateEmailWithUser(
			{
				user: approver,
				subject: this.GetSubject(count),
				template: ReminderMapping[scheduleName].template,
				customTags: this.GetCustomTags(count, approver),
				escapeCustomTags: true,
				backupUserAsCC: true,
				sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
			});
			if (email)
			{
				Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", Language.TranslateInto(ReminderMapping[scheduleName].fromName, approverLanguage, false));
				Sys.EmailNotification.SendEmail(email);
			}
		}
		else
		{
			Log.Warn("approver with login '" + login + "' not found");
		}
	}
};
var ReadFromRecords = {
	/**
	 * Extract info from records
	 */
	getUsers: function ()
	{
		var users = {};
		var processId = Process.GetProcessID(ReminderMapping[scheduleName].query.processName);
		var filter = ReminderMapping[scheduleName].query.filter;
		var prefixTable = "CD#";
		var attributes = ["OwnerId"];
		var handleResultsFunc = handleQueryResult;
		Log.Info("processId",processId);
		Log.Info("filter",filter);
		Log.Info("prefixTable",prefixTable);
		Log.Info("attributes",attributes);

		if (ReminderMapping[scheduleName].query.includeDnValidate)
		{
			attributes.push("DnValidate");
			handleResultsFunc = handleQueryResultWithDnValidate;
		}
		var query = Process.CreateQueryAsProcessAdmin();
		query.SetSpecificTable("".concat(prefixTable).concat(processId));
		query.SetFilter(filter);
		query.SetAttributesList(attributes.join(","));
		query.SetOptionEx("Limit=-1");
		query.SetOptionEx("FastSearch=1");
		query.SetOptions(0x00210000); // DBSET_READONLY | DBSET_QUICK
		var record = query.MoveFirst() ? query.MoveNextRecord() : null;
		Log.info("record",record);
		Log.info("query",query);
		if (record)
		{
			do {
				handleResultsFunc(record);
				record = query.MoveNextRecord();
			} while (record);
		}
		else
		{
			Log.Error("Unable to retrieve users : ".concat(query.GetLastErrorMessage()));
		}

		function handleQueryResultWithDnValidate(userRecord)
		{
			if (userRecord)
			{
				var nbDnValidate = userRecord.GetVars().GetNbValues("DnValidate");
				for (var i = 0; i < nbDnValidate; i++)
				{
					var dn = userRecord.GetVars().GetValue_String("DnValidate", i);
					var userLogin = dn ? Sys.Helpers.String.ExtractLoginFromDN(dn) : "";
					if (userLogin)
					{
						ReadFromRecords.updateLogin(users, userLogin);
					}
				}
				// FT-026568 : if no dnvalidate has been found, we use the ownerid
				if (nbDnValidate == 0)
				{
					var ownerid = userRecord.GetVars().GetValue_String("OwnerId", 0);
					var userLogin = ownerid ? Sys.Helpers.String.ExtractLoginFromDN(ownerid) : "";
					if (userLogin)
					{
						ReadFromRecords.updateLogin(users, userLogin);
					}
				}
			}
		}

		function handleQueryResult(userRecord)
		{
			if (userRecord)
			{
				var ownerId = userRecord.GetVars().GetValue_String("OwnerId", 0);
				var userLogin = ownerId ? Sys.Helpers.String.ExtractLoginFromDN(ownerId) : "";
				if (userLogin)
				{
					ReadFromRecords.updateLogin(users, userLogin);
				}
			}
		}
		return users;
	},
	/**
	 * update count for a specific login
	 */
	updateLogin: function (users, login)
	{
		if (Object.prototype.hasOwnProperty.call(users, login))
		{
			users[login]++;
		}
		else
		{
			users[login] = 1;
		}
	}
};
/**
 * sent an email to all users specified as parameter
 */
function notifyUsers(users)
{
	for (var login in users)
	{
		if (Object.prototype.hasOwnProperty.call(users, login))
		{
			EmailNotificationCtrl.NotifyApprover(login, users[login]);
		}
	}
}
/**
 * Retrieve schedule name to remind and check if exiting in ReminderMapping
 */
function getExistingScheduleName()
{
	var reportParameter = Variable.GetValueAsString("reportParameter");
	if (reportParameter)
	{
		var params = JSON.parse(reportParameter);
		if ("scheduleName" in params && !!ReminderMapping[params.scheduleName])
		{
			return params.scheduleName;
		}
		Log.Error("Schedule name is missing or unknown in reportParameter variable : ".concat(JSON.stringify(reportParameter), ". Prevent to execute schedule task."));
		Process.Exit(200);
		return null;
	}
	Log.Warn("Variable reportParameter is missing.");
	Log.Info("This process is updated in version 249 and requires 'reportParameter' variable process in scheduled task settings but old accounts do not have this variable yet. The default schedule task is 'Reminders for payment approval'.");
	return "defaultReminder";
}
var scheduleName = getExistingScheduleName();
if (scheduleName !== null)
{
	var usersToNotify = ReadFromRecords.getUsers();
	notifyUsers(usersToNotify);
}