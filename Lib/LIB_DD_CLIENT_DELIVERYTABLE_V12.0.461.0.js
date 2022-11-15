/* LIB_DEFINITION{
  "name": "Lib_DD_Client_DeliveryTable_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": []
}*/
var Lib;
Lib.DD_Client.AddLib("DeliveryTable", function ()
{
	var fieldsToQuery = [
		"RUIDEX", "RecipientType",
		"State", "_State%FORMATTED", "_ShortStatus%FORMATTED",
		"SubmitDateTime%FORMATTED", "CompletionDateTime%FORMATTED",
		"ToUser1", "ForwardTotal", "ResultJobID",
		"ToBlockAddress",
		"FaxNumber",
		"EmailAddress",
		"Status__",
		"Detailed_status__",
		"Completion_date__%FORMATTED"
	];

	var DeliveryTable =
	{
		// Private: contains every lines with raw or formatted data
		tableLines: [],
		transportMODOriginal: "MOD-ORIGINAL",
		transportMODResent: "MOD-RESENT",
		transportFaxOriginal: "FAX-ORIGINAL",
		transportFaxResent: "FAX-RESENT",
		transportSMOriginal: "SM-ORIGINAL",
		transportSMPortal: "SM-PORTAL",
		transportSMCopy: "SM-COPY",
		transportSMWelcome: "SM-WELCOME",
		transportSMResent: "SM-RESENT",
		transportSMGrouped: "SM-GROUPED",
		transportSOPOriginal: "SOP-ORIGINAL",
		transportSOPResent: "SOP-RESENT",

		// Entry point
		Manage: function ()
		{
			this.Init();

			var tablesToQuery =
				[
					"MOD", "SM", "CL", "FGFaxOut", "PU",
					"CDNAME#Customer Order Processing"
				];

			// Now build filter
			var originalJobID = Data.GetValue("OriginalJobID");
			if (!originalJobID)
			{
				// If the submission has been done directly in the SenderForm, there is not OriginalJobID
				// so we take our JobID because we are the root node of the workflow
				originalJobID = Data.GetValue("JobID");
			}
			var deliveryFormId = Data.GetValue("Document_ID__");
			var queryFilter = "(&(OriginalJobID=" + originalJobID + ")(Identifier=" + deliveryFormId + "))";

			// Finally perfom query
			Query.DBQuery(
				this.QueryCallback,
				tablesToQuery.join(","),
				fieldsToQuery.join("|"),
				queryFilter,
				"SubmitDateTime",
				50,
				this
			);
		},
		Init: function ()
		{
			ProcessInstance.SetSilentChange(true);

			// Flushes logical lines
			this.tableLines = [];

			// Set the second column extensible
			Controls.DeliveryTable__.SetWidth("100%");
			Controls.DeliveryTable__.SetExtendableColumn("DeliveryTable_Details__");

			// First empty table
			Controls.DeliveryTable__.SetItemCount(0);
			Controls.DeliveryTable__.SetAtLeastOneLine(false);

			// Display the loading .gif
			Controls.DeliveryTable_Loader__.Hide(false);

			// Remove the onclick
			Controls.DeliveryTable__.OnClick = null;

			Controls.DeliveryTable__.DisableLinesAudit(true);

			// Hide the "no message" message
			Controls.There_are_no_items_to_display__.Hide(true);

			ProcessInstance.SetSilentChange(false);
		},

		QueryCallback: function (query)
		{
			// The query is done, hide the loading .gif
			Controls.DeliveryTable_Loader__.Hide(true);

			var count = query.GetRecordsCount();
			if (count === 0 || User.isCustomer)
			{
				// Do nothing when no deliveries found: being processed, to validate
				Controls.Generated_transports_pane.Hide(true);
				return;
			}

			Controls.Generated_transports_pane.Hide(false);
			this.InitLines(query);
		},

		// Feeds the tableLines with enriched data
		InitLines: function (query)
		{
			var groupedEmailMsnex;
			var count = query.GetRecordsCount();

			// Feed an array tableLines with every raw data
			for (var i = 0; i < count; i++)
			{
				var line = this.InitLine(query, i);
				var displayLine = this.ExtendLine(line, query, i);

				if (displayLine)
				{
					this.tableLines.push(line);
				}

				if (line.groupedEmailMsnex)
				{
					groupedEmailMsnex = line.groupedEmailMsnex;
				}
			}

			if (groupedEmailMsnex)
			{
				// Run a second query to retreive Grouped Email information
				Query.DBQuery(
					function (q)
					{
						this.InitLines(q);
					},
					"SM",
					fieldsToQuery.join("|"),
					"(MSNEX=" + groupedEmailMsnex + ")",
					"SubmitDateTime",
					1,
					this
				);
			}
			else
			{
				this.DisplayLines();
			}
		},

		DisplayLines: function ()
		{
			this.SortLines();
			this.ManageHighlight();
			this.BuildTable();
		},

		// Set the common default values for every transport type
		InitLine: function (query, i)
		{
			var line =
			{
				// Common values
				ruidex: query.GetQueryValue("RUIDEX", i),
				state: parseInt(query.GetQueryValue("State", i), 10),
				submitDateTime: query.GetQueryValue("SubmitDateTime%FORMATTED", i),

				// Default 3 values
				type: "",
				details: query.GetQueryValue("_State%FORMATTED", i),
				datetime: query.GetQueryValue("CompletionDateTime%FORMATTED", i),

				// Transport embedded custom info in "ToUser1" field
				transportType: null,
				transportIsOriginal: false,

				//Used for filter Resent processes
				resultJobID: query.GetQueryValue("ResultJobID", i)
			};
			if (line.state === 100)
			{
				// Default details for success is mapped to "Sent"
				line.details = Language.Translate("_Sent");
			}
			else if (line.state === 400)
			{
				// Default details for reject is mapped to "Rejected"
				line.details = Language.Translate("_Rejected");
			}
			else if (line.state > 100)
			{
				// If an error occurred on transport, the default detail is the short status
				line.details = query.GetQueryValue("_ShortStatus%FORMATTED", i);
			}

			// The ToUser1 field is used in the DD flexible package to transmit transport informations
			var rawTransportInfos = query.GetQueryValue("ToUser1", i);
			if (rawTransportInfos)
			{
				var transportInfos = JSON.parse(rawTransportInfos);
				if (transportInfos)
				{
					line.transportType = transportInfos["DD-transportType"];
					// Boolean casting with "!!"
					line.transportIsOriginal = !!transportInfos["DD-transportIsOriginal"];
				}
			}
			return line;
		},

		// Enrich the default line object with transport specific data and formatting
		ExtendLine: function (line, query, i)
		{
			var displayLine = true;

			switch (line.transportType)
			{
				case this.transportMODOriginal:
				case this.transportMODResent:
					line = this.ExtendLineWithMOD(line, query, i);
					break;
				case this.transportFaxOriginal:
				case this.transportFaxResent:
					line = this.ExtendLineWithFAX(line, query, i);
					break;
				case this.transportSMOriginal:
				case this.transportSMPortal:
				case this.transportSMCopy:
				case this.transportSMWelcome:
				case this.transportSMResent:
				case this.transportSMGrouped:
					line = this.ExtendLineWithSM(line, query, i);
					break;
				case this.transportSOPOriginal:
				case this.transportSOPResent:
					line = this.ExtendLineWithSOP(line, query, i);
					break;
				default:
					// No transport type defined in "ToUser1", display nothing
					displayLine = false;
			}

			return displayLine;
		},
		ExtendLineWithMOD: function (line, query, i)
		{
			if (line.transportIsOriginal)
			{
				line.type = Language.Translate("_Original sent by MOD") + "\n";
				line.type += query.GetQueryValue("ToBlockAddress", i);
			}
			else
			{
				line.type = Language.Translate("_Copy resent by MOD") + "\n";
				line.type += query.GetQueryValue("ToBlockAddress", i);
			}
			return line;
		},

		ExtendLineWithSM: function (line, query, i)
		{
			if (line.transportType === this.transportSMOriginal)
			{
				line.type = Language.Translate("_Original sent by SM") + " " + query.GetQueryValue("EmailAddress", i);
			}
			else if (line.transportType === this.transportSMPortal)
			{
				line.type = Language.Translate("_Portal notification sent to") + " " + query.GetQueryValue("EmailAddress", i);
			}
			else if (line.transportType === this.transportSMGrouped)
			{
				var translationKey = Data.GetValue("Delivery_method__") === "SM" ? "_Grouped email sent to" : "_Grouped portal notification sent to";
				line.type = Language.Translate(translationKey) + " " + query.GetQueryValue("EmailAddress", i);
			}
			else if (line.transportType === this.transportSMCopy)
			{
				line.type = Language.Translate("_Copy e-mail sent to") + " " + query.GetQueryValue("EmailAddress", i);
			}
			else if (line.transportType === this.transportSMWelcome)
			{
				line.type = Language.Translate("_Welcome e-mail sent to") + " " + query.GetQueryValue("EmailAddress", i);
			}
			else if (line.transportType === this.transportSMResent)
			{
				line.type = Language.Translate("_Copy resent by SM") + " " + query.GetQueryValue("EmailAddress", i);
			}
			return line;
		},

		ExtendLineWithSOP: function (line)
		{
			if (line.transportType === this.transportSOPOriginal)
			{
				line.type = Language.Translate("_Original to SOP");
			}
			else if (line.transportType === this.transportSOPResent)
			{
				line.type = Language.Translate("_Resent to SOP");
			}
			return line;
		},

		ExtendLineWithFAX: function (line, query, i)
		{
			if (line.transportIsOriginal)
			{
				line.type = Language.Translate("_Original sent by FAX") + " " + query.GetQueryValue("FaxNumber", i);
			}
			else
			{
				line.type = Language.Translate("_Copy resent by FAX") + " " + query.GetQueryValue("FaxNumber", i);
			}
			return line;
		},

		// Sort array lines by transport type
		SortLines: function ()
		{
			this.tableLines.sort(
				function (a, b)
				{
					// If both transport have the same type, dunno how to sort
					if (a.transportType === b.transportType)
					{
						return 0;
					}

					// An original transport should be higher than the others
					if (a.transportIsOriginal && !b.transportIsOriginal)
					{
						return -1;
					}
					if (!a.transportIsOriginal && b.transportIsOriginal)
					{
						return 1;
					}

					// After original transports, we want to sort in this order
					var priority = ["SM-PORTAL", "SM-WELCOME", "SM-COPY"];
					for (var i = 0; i < priority.length; i++)
					{
						if (a.transportType === priority[i])
						{
							return -1;
						}
						if (b.transportType === priority[i])
						{
							return 1;
						}
					}

					// Now we only have resent possible, the submit date time is the main criteria
					return a.submitDateTime < b.submitDateTime ? -1 : 1;
				}
			);
		},

		ManageHighlight: function ()
		{
			// Look for the latest resent
			var resentFound = false;
			for (var i = this.tableLines.length - 1; i >= 0; i--)
			{
				var isLineResent = this.tableLines[i].transportType.indexOf("RESENT") !== -1;

				if (!resentFound && isLineResent)
				{
					// Switch the last resend to original
					resentFound = true;
					this.tableLines[i].transportIsOriginal = true;
				}
				else if (resentFound && this.tableLines[i].transportIsOriginal)
				{
					// Switch the original send to non-original
					this.tableLines[i].transportIsOriginal = false;
				}
			}
		},

		BuildTable: function ()
		{
			// Now feed the table from raw data
			for (var i = 0; i < this.tableLines.length; i++)
			{
				// Add a new item in the control table
				var item = Controls.DeliveryTable__.AddItem(false);
				item.SetValue("DeliveryTable_Type__", this.tableLines[i].type);
				item.SetValue("DeliveryTable_Details__", this.tableLines[i].details);
				item.SetValue("DeliveryTable_DateTime__", this.tableLines[i].datetime);

				// Manage line colors
				if (this.tableLines[i].state < 100)
				{
					Controls.DeliveryTable__.GetRow(i).DeliveryTable_Icon__.SetImageURL("being_process.png", false);
				}
				else if (this.tableLines[i].state === 100)
				{
					Controls.DeliveryTable__.GetRow(i).DeliveryTable_Icon__.SetImageURL("approval_green.png", false);
				}
				else if (this.tableLines[i].transportIsOriginal)
				{
					Controls.DeliveryTable__.GetRow(i).DeliveryTable_Icon__.SetImageURL("warning_red.png", false);
				}
				else
				{
					Controls.DeliveryTable__.GetRow(i).DeliveryTable_Icon__.SetImageURL("warning_yellow.png", false);
				}

				// Each line is clickable
				Controls.DeliveryTable__.GetRow(i).AddStyle("fake-link");
			}

			// Add links on every table row, targetting the RUIDEX stored in tableLines global
			var that = this;
			Controls.DeliveryTable__.OnClick = function (row)
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
		}
	};
	return DeliveryTable;
});
