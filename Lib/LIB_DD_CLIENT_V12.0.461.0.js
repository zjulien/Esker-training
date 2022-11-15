/* LIB_DEFINITION{
  "name": "Lib_DD_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "DD Client",
  "require": [
    "Sys/Sys_Helpers_Date"
  ]
}*/
/**
 * @namespace Lib.DD.Client
 */

var Lib;
Lib.AddLib("DD_Client", function ()
{
	/**
	 * Helpers for updating DD senders/recipients document tables. Requires the library Lib.DD
		 * @lends Lib.DD.Client
	 */
	var DD_Client =
	{
		// Cache array for GetCachedUser function
		cachedUsers: [],

		// Calls the "callbackFunction" with a user object matching the ownerID "userOwnedID".
		// If the user is in cache, the callback will be call synchronously.
		// If the user isn't, the user will be query and given to the callback asynchronously.
		// In this second case, the value "null" can be passed if no user were found by the ownerID.
		GetCachedUser: function (userOwnedID, callbackFunction)
		{
			var userObjFromCache = this.GetUserFromCache(userOwnedID);
			if (userObjFromCache === null)
			{
				// The user isn't in cache, let's query it and asynchronously apply the callback function
				Query.DBQuery(
					function (query)
					{
						// If no records are found, let's trigger the callback function with the null value
						if (query.GetRecordsCount() === 0)
						{
							callbackFunction(null);
						}
						else
						{
							// Build the user object and store it in the cache array
							var userObj =
							{
								ownerID: userOwnedID,
								ruidEx: query.GetQueryValue("RUIDEX"),
								displayName: query.GetQueryValue("DisplayName")
							};
							this.cachedUsers.push(userObj);

							// Trigger the callback with the freshly found user
							callbackFunction(userObj);
						}
					},
					"ODUSER",
					"RUIDEX|DisplayName",
					"(Login=" + userOwnedID + ")",
					"",
					1,
					this
				);
			}
			else
			{
				// This user is in cache, let's apply synchronously the callback function
				callbackFunction(userObjFromCache);
			}
		},

		// Private method used for the GetCachedUser function
		GetUserFromCache: function (userOwnerID)
		{
			for (var i = 0; i < this.cachedUsers.length; i++)
			{
				if (this.cachedUsers[i].ownerID === userOwnerID)
				{
					return this.cachedUsers[i];
				}
			}
			return null;
		},

		SetupArchiveValues: function ()
		{
			var archiveDurationString = this.FormatArchiveDuration();
			Controls.Archive_duration_preview__.SetText(archiveDurationString);

			if (ProcessInstance.state < 50)
			{
				// Being processed, let expiration empty
				return;
			}

			var archiveExpirationString = this.FormatArchiveExpirationDate();
			if (archiveExpirationString)
			{
				Controls.Archive_expiration_date_preview__.SetText(archiveExpirationString);
			}
		},

		// Returns a user's culture formatted string based on record's archive nodes value
		FormatArchiveDuration: function ()
		{
			// Label initialized to "2 months"
			var archiveDurationString = Language.Translate("_no archive");

			// First we check with ContainerFlag that the record won't be modified anymore by conncont
			var archiveState = Data.GetValue("ArchiveState");
			var isArchivingDone = archiveState && (archiveState !== "0");

			// Check for ArchiveExpiration and ArchiveDateTime
			var archiveExpiration = Data.GetValue("ArchiveExpiration");
			var isArchiveExpirationSet = (archiveExpiration && archiveExpiration.toString());

			if (!isArchivingDone || isArchiveExpirationSet)
			{
				var archiveDuration = Data.GetValue("ArchiveDuration");
				archiveDurationString = Language.Translate("_no archive");
				if (archiveDuration > 0)
				{
					var yearCount = (archiveDuration / 12);
					if (yearCount < 1)
					{
						archiveDurationString = archiveDuration + " " + Language.Translate("_months");
					}
					else if (yearCount == 1)
					{
						archiveDurationString = yearCount + " " + Language.Translate("_year");
					}
					else
					{
						archiveDurationString = yearCount + " " + Language.Translate("_years");
					}
				}
			}

			return archiveDurationString;
		},

		// Returns a user's culture formatted string based on record's archive nodes value
		FormatArchiveExpirationDate: function ()
		{
			// Archive expiration is valid once Archive action has been processed
			var archiveState = Data.GetValue("ArchiveState");
			var isArchivingDone = archiveState && (archiveState !== "0");

			// The record is never archived before a final state
			if (!isArchivingDone || Data.GetValue("State") < 100)
			{
				return "";
			}

			// Check for ArchiveExpiration and ArchiveDateTime
			var archiveExpiration = Data.GetValue("ArchiveExpiration");
			var isArchiveExpirationSet = (archiveExpiration && archiveExpiration.toString());

			if (!isArchiveExpirationSet)
			{
				// The record isn't archived, let's calculate the CompletionDateTime plus 60 days
				archiveExpiration = Data.GetValue("CompletionDateTime");
				if (archiveExpiration instanceof Date)
				{
					archiveExpiration.setTime(archiveExpiration.getTime() + (60 * 24 * 3600 * 1000));
				}
			}

			// Now format and set the archive expiration field
			if (archiveExpiration instanceof Date)
			{
				return Sys.Helpers.Date.ToLocaleDateEx(archiveExpiration, User.culture);
			}

			return null;
		},

		AddMessageToTable: function (table, id, rank, message)
		{
			// Init at first call
			if (table === null)
			{
				table = [];
			}

			// Search for the unique ID in the list
			var idIndex = -1;
			for (var i = 0; i < table.length && idIndex < 0; i++)
			{
				if (table[i].id === id)
				{
					idIndex = i;
				}
			}

			if (idIndex < 0)
			{
				// Avoid having the same id in the list
				table.push({ id: id, rank: rank, message: message });
			}
			else if (table[idIndex].rank !== rank)
			{
				// Update ranking for this id
				table[idIndex].rank = rank;
			}

			// Sort by rank
			table.sort(function (a, b) { return (a.rank > b.rank); });

			return table;
		},

		// Manage multiple warnings in the same "WarningLabel__" description control.
		// Each entry have an unique identifier (avoiding adding multiple time the same message),
		// a rank (the higher will be in top position) and the translated message.
		warningMessages: null,
		AddWarningMessageOnSenderForm: function (id, rank, message)
		{
			this.warningMessages = this.AddMessageToTable(this.warningMessages, id, rank, message);
			// Add each messages on a new line
			var buffer = "";
			for (var i = 0; i < this.warningMessages.length; i++)
			{
				buffer += this.warningMessages[i].message + "\n";
			}

			// Add at the end the common validation message
			if (Data.GetValue("State") === 70)
			{
				buffer += Language.Translate("_The current {0} requires a manual approval", false, Data.GetValue("Document_Type__"));
			}

			// Finally manage the warning diplay
			Controls.WarningLabel__.SetLabel(buffer);
			Controls.Error_pane.Hide(false);
			Controls.WarningLabel__.Hide(false);
			Controls.Error_spacer__.Hide(!Controls.ErrorLabelReason__.IsVisible());
		},

		// Manage multiple errors in the same "ErrorLabelReason__" description control.
		// Each entry have an unique identifier (avoiding adding multiple time the same message),
		// a rank (the higher will be in top position) and the translated message.
		errorMessages: null,
		AddErrorMessageOnSenderForm: function (id, rank, message)
		{
			this.errorMessages = this.AddMessageToTable(this.errorMessages, id, rank, message);
			// Add each messages on a new line
			var buffer = "";
			for (var i = 0; i < this.errorMessages.length; i++)
			{
				buffer += this.errorMessages[i].message + "\n";
			}

			Controls.ErrorLabelReason__.SetLabel(buffer);
			Controls.Error_pane.Hide(false);
			Controls.ErrorLabelReason__.Hide(false);
			Controls.Error_spacer__.Hide(!Controls.WarningLabel__.IsVisible());
		},

		/**
		 * For design purposes, show or hide every form components (except additional fields).
		 * JSON params are not mandatory, but you can specify:
		 * - showframes: true or false (default)
		 * 		=> Force to show every frames
		 * - showbuiltins: true or false (default)
		 * 		=> Force to show SystemData, DocumentsPanel and NextProcess controls
		 * - isDebugging: true or false (default)
		 *		=> Force display of additional fields
		 */
		ShowAllControls: function (jsonParams)
		{
			if (!jsonParams)
			{
				jsonParams = {};
			}

			var frames = ["form-content-top", "form-content-bottom", "form-content-left", "form-content-right", "form-header"];
			var builtins = ["NextProcess", "SystemData", "DocumentsPanel"];

			for (var c in Controls)
			{
				var control = Controls[c];
				var controlName = Controls[c].GetName();

				var isFrame = (frames.indexOf(controlName) != -1);
				var isBuiltIn = (builtins.indexOf(controlName) != -1);

				var additionnalFieldInfo = control.GetAdditionalFieldInfo();

				var isActive = additionnalFieldInfo.isActive;
				if (additionnalFieldInfo.activationCondition)
				{
					var value = Data.GetValue(additionnalFieldInfo.activationCondition.field);
					isActive = additionnalFieldInfo.activationCondition.values.indexOf(value) >= 0;
				}

				if (jsonParams.isDebugging || !additionnalFieldInfo.isAdditionalField || isActive)
				{
					var showForFrame = isFrame && jsonParams.showframes === true;
					var showForBuiltIn = isBuiltIn && jsonParams.showbuiltins === true;
					var showForOthers = !isFrame && !isBuiltIn;
					if (showForFrame || showForBuiltIn || showForOthers)
					{
						control.Hide(false);
					}
				}
			}
		},
		DisplayPreviewPanel: function (display, setProcessFullWidth)
		{
			if (display && setProcessFullWidth)
			{
				// full width
				ProcessInstance.SetFormWidth();
			}
			else
			{
				ProcessInstance.SetFormWidth(display ? 1440 : 860);
			}

			Controls.PreviewPanel.Hide(!display);
			Controls.form_content_right.Hide(!display);
		}
	};
	return DD_Client;
});
