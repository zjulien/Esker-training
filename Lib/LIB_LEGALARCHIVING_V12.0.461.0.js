///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_LegalArchiving_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers",
    "[Lib_AP_Customization_Archiving]"
  ]
}*/
var Lib;
Lib.AddLib("LegalArchiving", function ()
{
	var legalArchiving =
	{
		providerSolution: "",
		providerName: "Arkhineo",
		isEnable: true,
		processName: "",

		IsEnable: function ()
		{
			return this.isEnable;
		},

		EnableLegalArchiving: function (value)
		{
			if (typeof value === "boolean")
			{
				this.isEnable = value;
			}
		},

		SetArchiveProcessName: function (value)
		{
			if (typeof value === "string")
			{
				this.processName = value;
			}
		},

		SetArchiveProviderSolution: function (value)
		{
			if (typeof value === "string")
			{
				this.providerSolution = value;
			}
		},

		SetArchiveProviderName: function (value)
		{
			if (typeof value === "string")
			{
				this.providerName = value;
			}
		},

		Archive: function ()
		{
			if (!this.IsEnable() || !this.processName)
			{
				return "";
			}

			var nbAttach = Attach.GetNbAttach();
			if (nbAttach <= 0)
			{
				Log.Info("No files to archive.");
				return "";
			}

			var xTransport = Process.CreateProcessInstance(this.processName, false, true);
			if (xTransport)
			{
				var archiveDuration = Data.GetValue("ArchiveDuration");
				var ruidex = Data.GetValue("RUIDEX");

				var vars = xTransport.GetUninheritedVars();
				vars.AddValue_String("Subject", this.processName + " for " + ruidex, true);
				vars.AddValue_String("ArchiveProvider", this.providerName, true);
				vars.AddValue_Long("ArchiveDuration", archiveDuration, true);
				if (this.providerSolution && this.providerSolution.length > 0)
				{
					vars.AddValue_String("ArchiveProviderSolution", this.providerSolution, true);
				}
				vars.AddValue_Long("ArchiveBehavior", "2", true);

				// Archive only processed document
				for (var i = 0; i < nbAttach; i++)
				{
					if (Attach.IsProcessedDocument(i))
					{
						var addAttach = xTransport.AddAttachEx(Attach.GetInputFile(i));
						var newAttachVars = addAttach.GetVars();
						newAttachVars.AddValue_String("AttachOutputName", Attach.GetName(i), true);
						break;
					}
				}

				//Add external variables
				var externalVars = xTransport.GetExternalVars();
				var defaultApplicative = {
					"ds-metadata": {
						ID: Data.GetValue("RuidEx"),
						CID: Data.GetValue("MsnEx") + "." + Data.GetValue("SubmittingServerID"),
						MA: Data.GetValue("MainAccountID"),
						TBL: "EskerWS",
						DATE: new Date()
					}
				};
				var applicative = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Archiving.GetArkhineoMetaDataApplicative", defaultApplicative) || defaultApplicative;
				externalVars.AddValue_String("ArkhineoMetaDataApplicative", JSON.stringify(applicative), true);

				var descriptive = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Archiving.GetArkhineoMetaDataDescriptive");
				if (descriptive)
				{
					externalVars.AddValue_String("ArkhineoMetaDataDescriptive", JSON.stringify(descriptive), true);
				}

				xTransport.Process();

				var ret = xTransport.GetLastError();
				if (ret === 0)
				{
					return xTransport.GetUninheritedVars().GetValue_String("RUIDEX", 0);
				}
			}

			Log.Error("Failed to archive into the process " + this.processName);
			return "";
		}
	};

	return legalArchiving;
});