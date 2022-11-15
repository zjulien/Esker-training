/* LIB_DEFINITION{
  "name": "Lib_DD_Client_HistoryTable_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "DD Client history table",
  "require": [
    "Lib_DD_Client_V12.0.461.0",
    "Sys/Sys_Helpers_Date"
  ]
}*/
///#GLOBALS Sys
var Lib;
Lib.DD_Client.AddLib("HistoryTable", function ()
{
	var HistoryTable =
	{
		// Contains every lines with raw or formatted data
		tableLines: [],

		// We want the table to be built only once
		isBuilt: false,

		// Entry point
		Manage: function ()
		{
			if (!this.isBuilt)
			{
				ProcessInstance.SetSilentChange(true);
				this.Init();

				this.AddSubmittedLine();
				this.AddValidationLine();
				this.AddCancelLine();
				this.AddFinalStateLine();
				this.AddPostEditingLines();
				this.AddArchivingLine();

				this.UpdateAllUserDisplayNames();

				this.SortAndBuildTable();

				this.isBuilt = true;
				ProcessInstance.SetSilentChange(false);
			}
		},

		Init: function ()
		{
			// Flushes logical lines
			this.tableLines = [];

			// Set the second column extensible
			Controls.HistoryTable__.SetWidth("100%");
			Controls.HistoryTable__.SetExtendableColumn("HistoryTable_Details__");
			Controls.HistoryTable__.SetItemCount(0);
			Controls.HistoryTable__.SetAtLeastOneLine(false);
			Controls.HistoryTable__.DisableLinesAudit(true);
		},

		AddGenericLine: function (lineType, dateObj, detailsString, performTimezoneShift, ruidex)
		{
			// NOTE: The lineType is a kind of unique string identifying the line into the tableLines array.
			// For the moment, it is used only for the validation that asynchronously update the "VALIDATION" line.
			var line =
			{
				"type": lineType,
				"datetime": dateObj,
				"details": detailsString,
				"ruidex": ruidex
			};

			// Workaround: system dates are not getted in the right timezone with Data.GetValue().
			// We shift it for a correct display but the framework might be updated.
			if (performTimezoneShift)
			{
				var dateOffset = line.datetime.getTimezoneOffset() * 60 * 1000;
				var userOffset = User.utcOffset;
				var computedOffset = dateOffset + userOffset;
				if (computedOffset !== 0)
				{
					line.datetime.setTime(line.datetime.getTime() + computedOffset);
				}
			}

			this.tableLines.push(line);
			return line;
		},

		AddSubmittedLine: function ()
		{
			var submitDateTime = Data.GetValue("SubmitDateTime");
			var isSubmitDateTimeSet = (submitDateTime && submitDateTime.toString());
			if (isSubmitDateTimeSet)
			{
				this.AddGenericLine("SUBMITTED", submitDateTime, Language.Translate("_History table submitted"), true);
			}
		},

		AddValidationLine: function ()
		{
			var needValidation = Data.GetValue("NeedValidation");
			var touchLessDone = (Data.GetValue("TouchLessDone")) ? Data.GetValue("TouchLessDone") : "0";
			var validationOwnerId = Data.GetValue("ValidationOwnerId");
			var validationState = Data.GetValue("ValidationState");
			var validationDateTime = Data.GetValue("ValidationDateTime");

			// Checks that the form has been manually validated or rejected
			var isValidatedOrRejected = (validationState !== "1" && validationState !== "2");
			if (needValidation !== "1" || touchLessDone !== "0" || !validationOwnerId || isValidatedOrRejected)
			{
				return;
			}

			// Choose between validated and rejected key
			var translationKey = (validationState === "1") ? "_History table validated by {0}" : "_History table rejected by {0}";
			var validationMessage = Data.GetValue("Validation_comment__");
			var commentPrefix = Language.Translate("_Log entry generic comment label");

			function getValidationDetailsString(userDisplayName)
			{
				var result = Language.Translate(translationKey, true, userDisplayName);
				if (validationMessage)
				{
					result += "\n" + commentPrefix + " " + validationMessage;
				}
				return result;
			}

			var detailsString = getValidationDetailsString("...");
			var line = this.AddGenericLine("VALIDATION", validationDateTime, detailsString, true);

			// Set information used in UpdateAllUserDisplayNames to asynchronously update the user DisplayName
			line.userIdForDisplayName = validationOwnerId;
			line.detailsFunc = getValidationDetailsString;
		},

		AddCancelLine: function ()
		{
			var cancelRequestDateTime = Data.GetValue("CancelRequestDateTime");
			var iscancelRequestDateTimeSet = (cancelRequestDateTime && cancelRequestDateTime.toString());
			if (iscancelRequestDateTimeSet)
			{
				this.AddGenericLine("CANCEL", cancelRequestDateTime, Language.Translate("_History table cancel requested"), true);
			}
		},

		AddFinalStateLine: function ()
		{
			var state = parseInt(Data.GetValue("State"), 10);
			var completionDateTime = Data.GetValue("CompletionDateTime");
			var isCompletionDateTimeSet = (completionDateTime && completionDateTime.toString());
			var isStateInError = state === 100 || state === 200 || state === 300;
			var isCancelEDI = (state === 300) && Data.GetValue("EDI_Cancel_Status__");

			if (isCompletionDateTimeSet && isStateInError && !isCancelEDI)
			{
				var translationKey = "_History table state " + state;
				var detailsString = Language.Translate(translationKey);
				this.AddGenericLine("FINALSTATE", completionDateTime, detailsString, true);
			}
		},

		AddPostEditingLines: function ()
		{
			var auditEvents = this.GetSortedAuditEventsJSON();
			if (!auditEvents)
			{
				return;
			}

			function getAuditDetailsString(userDisplayName)
			{
				return Language.Translate("_Data modified after archiving by {0}", false, userDisplayName);
			}

			var ruptureDate = null;
			var ruptureAuthor = null;
			for (var i = 0; i < auditEvents.length; i++)
			{
				var audit = auditEvents[i];

				// The date/author has changed, let's start a new line
				var ruptureBegin = (ruptureDate !== audit.AuditDateUnixTime) || (ruptureAuthor !== audit.UserID);
				if (ruptureBegin)
				{
					ruptureDate = audit.AuditDateUnixTime;
					ruptureAuthor = audit.UserID;
				}

				// It's the last event or the next audit date/author are different, let's write the line
				// with all the stacked audit events
				var isLastIndex = ((i + 1) === auditEvents.length);
				var ruptureEnd = isLastIndex || ((Math.abs(auditEvents[i + 1].AuditDateUnixTime - ruptureDate) > 60) || auditEvents[i + 1].UserID !== ruptureAuthor);
				if (ruptureEnd)
				{
					var userDisplayName = audit.UserDisplayName || audit.UserID;
					var detailsString = getAuditDetailsString(userDisplayName);

					// Finally line is added to the table
					var auditDate = new Date(audit.AuditDateUnixTime * 1000);
					var line = this.AddGenericLine("POSTEDITING", auditDate, detailsString, true);

					if (userDisplayName === audit.UserID)
					{
						// Set information used in UpdateAllUserDisplayNames to asynchronously update the user DisplayName
						line.userIdForDisplayName = audit.UserID;
						line.detailsFunc = getAuditDetailsString;
					}
				}
			}
		},

		UpdateAllUserDisplayNames: function ()
		{
			var updatedUserIds = [];
			for (var i = 0; i < this.tableLines.length; i++)
			{
				var tableLine = this.tableLines[i];
				var userId = tableLine.userIdForDisplayName;
				if (userId && updatedUserIds.indexOf(userId) < 0)
				{
					updatedUserIds.push(userId);
					this.UpdateUserDisplayName(userId);
				}
			}
		},

		UpdateUserDisplayName: function (userId)
		{
			var that = this;
			Lib.DD_Client.GetCachedUser(
				userId,
				function (userObj)
				{
					if (userObj && userObj.displayName)
					{
						for (var i = 0; i < that.tableLines.length; i++)
						{
							var tableLine = that.tableLines[i];
							if (tableLine.userIdForDisplayName === userId)
							{
								tableLine.details = tableLine.detailsFunc(userObj.displayName);
							}
						}

						that.SortAndBuildTable();
					}
				});
		},

		AddArchivingLine: function ()
		{
			var archiveDurationString = Lib.DD_Client.FormatArchiveDuration();
			var archiveExpirationString = Lib.DD_Client.FormatArchiveExpirationDate();

			if (archiveExpirationString)
			{
				// Take the ArchiveDateTime, or CompletionDateTime if it doesn't exists
				var archiveDateTime = Data.GetValue("ArchiveDateTime");
				var isArchiveDateTimeSet = (archiveDateTime && archiveDateTime.toString());
				if (!isArchiveDateTimeSet)
				{
					archiveDateTime = Data.GetValue("CompletionDateTime");
				}

				// If there are some post-editing events, we want to show the recipient the archiving
				// line after the last edition, that's why we take the latest audit event date
				var auditEvents = this.GetSortedAuditEventsJSON();
				if (auditEvents && auditEvents.length !== 0)
				{
					var lastEvent = auditEvents[auditEvents.length - 1];
					var lastEventDate = new Date(lastEvent.AuditDateUnixTime * 1000);
					archiveDateTime = lastEventDate;
				}

				var detailsString = Language.Translate("_History table archived for {0} until {1}", true, archiveDurationString, archiveExpirationString);
				this.AddGenericLine("ARCHIVING", archiveDateTime, detailsString, true);
			}
		},


		// Sort array lines by date time
		SortLines: function ()
		{
			// Returns true if a and b have the same date and are of type 1 and type 2
			var CompareHelper = function (a, b, type1, type2)
			{
				var aIsType1 = (a.type === type1);
				var bIsType1 = (b.type === type1);
				var aIsType2 = (a.type === type2);
				var bIsType2 = (b.type === type2);
				var areDateTimeEquals = (a.datetime.getTime() === b.datetime.getTime());
				return (areDateTimeEquals && (aIsType1 && bIsType2 || aIsType2 && bIsType1));
			};

			this.tableLines.sort(
				function (a, b)
				{
					if (a.type === b.type || !(a.datetime instanceof Date) || !(b.datetime instanceof Date))
					{
						return 0;
					}

					if (CompareHelper(a, b, "ARCHIVING", "FINALSTATE"))
					{
						// The ARCHIVING line and FINALSTATE can have the same date "CompletionDateTime"
						// so let's put ARCHIVING in last position
						return (a.type === "ARCHIVING") ? 1 : -1;
					}
					else if (CompareHelper(a, b, "SUBMITTED", "DUPLICATEFOUND"))
					{
						// The SUBMITTED line and DUPLICATEFOUND can have the same date "SubmissionDateTime"
						// so let's put DUPLICATEFOUND in last position
						return (a.type === "DUPLICATEFOUND") ? 1 : -1;
					}

					// For every other cases, simple sort by datetime
					return Sys.Helpers.Date.CompareDate(a.datetime, b.datetime);
				}
			);
		},

		SortAndBuildTable: function ()
		{
			// Sort table lines
			this.SortLines();

			ProcessInstance.SetSilentChange(true);

			// First empty table
			Controls.HistoryTable__.SetItemCount(0);

			// Now add lines items to the control
			for (var i = 0; i < this.tableLines.length; i++)
			{
				var item = Controls.HistoryTable__.AddItem(false);
				item.SetValue("HistoryTable_DateTime__", this.tableLines[i].datetime);
				item.SetValue("HistoryTable_Details__", this.tableLines[i].details);

				if (this.tableLines[i].ruidex)
				{
					Controls.HistoryTable__.GetRow(i).HistoryTable_Details__.AddStyle("link");
				}
			}

			// Add links on every table row, targetting the RUIDEX stored in tableLines global
			var that = this;
			Controls.HistoryTable__.OnClick = function (row)
			{
				if (that.tableLines && that.tableLines[row.GetLineNumber() - 1].ruidex)
				{
					var currentLine = that.tableLines[row.GetLineNumber() - 1];
					if (currentLine && currentLine.ruidex)
					{
						Process.OpenMessage(currentLine.ruidex, true);
					}
				}
			};

			ProcessInstance.SetSilentChange(false);
		},

		// Private: helper to get audit events
		CachedAuditEventJSON: null,
		GetSortedAuditEventsJSON: function ()
		{
			if (!this.CachedAuditEventJSON)
			{
				var auditEventsStr = Data.GetValue("AuditEvents");
				if (!auditEventsStr)
				{
					return null;
				}

				var auditEvents = null;
				try
				{
					auditEvents = JSON.parse(auditEventsStr);
				}
				catch (e)
				{
					Log.Error(e.message);
				}
				if (!auditEvents)
				{
					return null;
				}

				// Sort events by modification date
				auditEvents.sort(
					function (a, b)
					{
						return Sys.Helpers.Date.CompareDate(a.AuditDateUnixTime, b.AuditDateUnixTime);
					}
				);

				this.CachedAuditEventJSON = auditEvents;
			}

			return this.CachedAuditEventJSON;
		}

	};
	return HistoryTable;
});
