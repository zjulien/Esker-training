/* LIB_DEFINITION{
  "name": "LIB_DUPLICATECHECK_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/

/**
 * Searches of any duplicate document already processed
 * @namespace Lib.DuplicateCheck
 */

var Lib;
Lib.AddLib("DuplicateCheck", function ()
{
	/**
	 * Contains the options and parameters
	 * @lends Lib.DuplicateCheck
	 */
	var DuplicateCheck =
	{
		/**
		 * @class
		 */
		Options:
		{
			/**
			* Max number of duplicate returns
			* @type integer
			* @default 10
			*/
			MaxReturnedDuplicates: 10,

			/**
			* A boolean which indicate to search only for approved processes
			* @type boolean
			* @default false
			*/
			CheckOnlyApproved: false,

			/**
			* Name of the control on the process to use as key for duplicate key control
			* @type string[]
			* @example ["CompanyCode__", "VendorNumber__"], ["CustomerNumber__"]
			*/
			DuplicateKeyControls: [],

			/**
			* Name of the controls to use to find the duplicates
			* @type string[]
			*/
			ControlsToCheck: [],


			/**
			* Name of the control on the process to use to know the duplicate alert level
			* @type string
			* @default "DuplicateCheckAlertLevel__"
			*/
			AlertLevelControlName: "DuplicateCheckAlertLevel__",

			/**
			* Name of the variable to use to disable the duplicate check
			* @type string
			* @default "DoNotCheckDuplicates"
			*/
			DoNotCheckVariableName: "DoNotCheckDuplicates",

			/**
			 * List the specifics options for the query
			 * @class
			 */
			Query:
			{
				/**
				* Number of days to search for the recode
				* @type integer
				* @default 90
				*/
				MaxDateRangeInDays: 60,
				/**
				* Name of the field to use for the period range restriction
				* @type string
				* @default SubmitDateTime
				*/
				DateRangeFieldName: "SubmitDateTime",
				/**
				* Name of the control on the process to use to sort possibles duplicates
				* @type string
				* @default SubmitDateTime
				* @example "InvoiceDate__", "Sales_Order_Date__"
				*/
				SortOnControlName: "SubmitDateTime",
				/**
				* Indicate if the query need to search in VLA
				* @type boolean
				*/
				SearchInArchive: false,
				/**
				* A string which allow to add a custom filter to the query that search for duplicate processes
				* @type string
				*/
				CustomFilter: "",

				/**
				* An optional list of field to return for each duplicate
				* @type string[]
				*/
				AdditionalAttributes: []
			}
		},

		/**
		* A string[] that contains all the duplicate
		*/
		duplicateList: null,

		/**
		* Initialize the Options that will be use for the duplicate check
		*
		* @param {string[]} aDuplicateKeyControls List of the controls which contains the key
		* @param {string[]} aControlsToCheck List of the controls name to check
		* @param {Options.Query} mQueryOptions Specifics options for the query
		*/
		InitCheckDuplicate: function (aDuplicateKeyControls, aControlsToCheck, mQueryOptions)
		{
			this.duplicateList = [];

			this.Options.DuplicateKeyControls = aDuplicateKeyControls;
			this.Options.ControlsToCheck = aControlsToCheck;

			// Don't override all the object to keep the default value, only the one redefined
			for (var sKey in mQueryOptions)
			{
				if (this.Options.Query.hasOwnProperty(sKey))
				{
					this.Options.Query[sKey] = mQueryOptions[sKey];
				}
			}

			//Avoid duplicate query between AdditionalAttributes and ControlsToCheck
			var aAdditionalAttributes = [];

			for (var i = 0; i < this.Options.Query.AdditionalAttributes.length; ++i)
			{
				if (this.Options.ControlsToCheck.indexOf(this.Options.Query.AdditionalAttributes[i]) === -1)
				{
					aAdditionalAttributes.push(this.Options.Query.AdditionalAttributes[i])
				}
			}

			this.Options.Query.AdditionalAttributes = aAdditionalAttributes;
		},

		/**
		* Search for the specified RUIDEX in the current duplicate list.
		*
		* @param {string} RUIDEX The RUIDEX to find
		* @return {string} The string of the duplicate RUIDEX if exist or null
		*/
		IsRUIDEXExist: function (RUIDEX)
		{
			var itemsCount = this.duplicateList.length;
			for (var i = 0; i < itemsCount; i++)
			{
				if (this.duplicateList[i].RUIDEX === RUIDEX)
				{
					return this.duplicateList[i];
				}
			}
			return null;
		},

		/**
		* Get the value of a process control.
		* If the value is a Date, it will convert it in a string in UTC date format
		*
		* @param {string} controlName The name of a control on the process
		* @return {string} The value of the control
		*/
		GetControlToCheckValue: function (controlName)
		{
			var controlValue = Data.GetValue(controlName);
			if (controlValue !== null && controlValue instanceof Date)
			{
				controlValue = Sys.Helpers.Date.ToUTCDate(controlValue);
			}
			return controlValue;
		},

		/**
		* Build the key filter based on the duplicate key controls
		*
		* @return {string} The filter based on the duplicate key controls
		*/
		BuildDuplicateKeyFilter: function ()
		{
			var allKeysHaveAValue = true;
			var filter = "";
			if (this.Options.DuplicateKeyControls.length > 0)
			{
				filter = "(&";
				for (var key in this.Options.DuplicateKeyControls)
				{
					var controlValue = this.GetControlToCheckValue(this.Options.DuplicateKeyControls[key]);
					if (controlValue)
					{
						filter += "(" + this.Options.DuplicateKeyControls[key] + "=" + controlValue + ")";
					}
					else
					{
						allKeysHaveAValue = false;
					}
				}
				filter += ")";
			}
			if (allKeysHaveAValue)
			{
				return filter;
			}
			else
			{
				return "";
			}
		},

		/**
		* Check that any control to check has a value
		*
		* @return {object[]} an object for each valid control
		*					{ name: ControlName, value: ControlValue}
		*/
		GetValidControlsToCheck: function ()
		{
			var validControls = [];
			var nbControlsToCheck = this.Options.ControlsToCheck !== null ? this.Options.ControlsToCheck.length : 0;
			var i = 0;

			for (; i < nbControlsToCheck; i++)
			{
				var controlName = this.Options.ControlsToCheck[i];
				var controlValue = this.GetControlToCheckValue(controlName);
				if (controlValue !== null && controlValue !== undefined && controlValue.length !== 0)
				{
					var o = {
						name: controlName,
						value: controlValue
					};
					validControls.push(o);
				}
			}

			return validControls;
		},

		/**
		* Build a filter for a specific control and value
		*
		* @param {object} controlToCheck A validControlToCheck which contains the name and the value
		* @return {string} The computed filter for the control
		*/
		BuildControlFilter: function (controlToCheck)
		{
			//[AP]RD00028986-IPS-TDB
			return Sys.Helpers.LdapUtil.FilterEqual(controlToCheck.name, controlToCheck.value).toString();
		},

		/**
		* Build the specific filter based on the fields to check and the alert level
		*
		* @param {integer} alertLevel The alert level (1, 2 or 3)
		* @return {string} The filter based on the fields to check and the alert level
		*/

		CopyArray: function (aArray)
		{
			var aOut = [];

			for (var i = 0; i < aArray.length; ++i)
			{
				aOut.push(aArray[i]);
			}

			return aOut;
		},

		Permutation: function (aEntries, iGroupSize)
		{
			var aResult = [];
			var aGroup = Array(iGroupSize);

			this.PermutationRecursif(aEntries, 0, iGroupSize, aGroup, 0, aResult);

			return aResult;
		},

		//Don't use this function, use the one above
		PermutationRecursif: function (aEntries, iIndex, iGroupSize, aGroup, iIndexGroup, aResult)
		{
			if (iGroupSize === 0)
			{
				aResult.push(this.CopyArray(aGroup));
				return;
			}

			for (var i = iIndex; aEntries.length - i + 1 > iGroupSize; i++)
			{
				aGroup[iIndexGroup] = aEntries[i];
				this.PermutationRecursif(aEntries, i + 1, iGroupSize - 1, aGroup, iIndexGroup + 1, aResult);
			}
		},

		BuildControlToCheckFilter: function (iGroupSize)
		{
			//Retrieve the list of valid controls to check.
			//Controls with no value are excluded from the duplicate check
			var aValidControls = this.GetValidControlsToCheck();

			if (aValidControls.length < iGroupSize || iGroupSize < 1)
			{
				return null;
			}

			var aEntries = [];

			for (var i = 0; i < aValidControls.length; i++)
			{
				aEntries.push(this.BuildControlFilter(aValidControls[i]));
			}

			Log.Info("Permutation:" + iGroupSize + "/" + aEntries.length);

			var aResult = this.Permutation(aEntries, iGroupSize);

			var sFilter = "(|";
			for (var i = 0; i < aResult.length; ++i)
			{
				sFilter += "(&";
				for (var j = 0; j < aResult[i].length; ++j)
				{
					sFilter += aResult[i][j];
				}
				sFilter += ")";
			}
			sFilter += ")";

			return sFilter;
		},

		/**
		* Construct the full filter to find possible duplicate
		*
		* @param {string} duplicateKeyFilter The key filter
		* @param {string} duplicateFilter The filter based on the values to check
		* @return {string} The filter to use for the query
		*/
		BuildQueryFilter: function (duplicateKeyFilter, duplicateFilter)
		{
			// 70 The message has been converted but wait before sending
			// 80 The message is sending by connector
			// 90 The message has been processed by the connector and is waiting for an update.
			// 100 The message is terminated successfully
			var filter = "&(|(State=100)(State=90)(State=80)";
			if (!this.Options.CheckOnlyApproved)
			{
				filter += "(State=70)";
			}
			filter += ")";
			filter += "(!(MSNEX=" + Data.GetValue("MSNEX") + "))";
			filter += "(&(SplitDone=0)(Deleted=0))";
			filter += duplicateKeyFilter;
			filter += duplicateFilter;
			filter += this.Options.Query.CustomFilter;

			if (this.Options.Query.MaxDateRangeInDays > 0)
			{
				var date = new Date();
				date.setTime(date.getTime() - this.Options.Query.MaxDateRangeInDays * 24 * 60 * 60 * 1000);
				filter += "(" + this.Options.Query.DateRangeFieldName + ">" + Sys.Helpers.Date.Date2DBDate(date) + ")";
			}

			Log.Info("Check duplicates filter: " + filter);

			return filter;
		},

		/**
		* Construct, call the query and fill the duplicateList variable
		*
		* @param {string} duplicateKeyFilter The key filter
		* @param {string} duplicateFilter The filter based on the values to check
		*/
		QueryForDuplicate: function (duplicateKeyFilter, duplicateFilter)
		{
			Query.Reset();
			Query.SetSpecificTable("CD#" + Data.GetValue("ProcessId"));
			Query.SetFilter(this.BuildQueryFilter(duplicateKeyFilter, duplicateFilter));
			Query.SetSortOrder(this.Options.Query.SortOnControlName + " DESC");
			var additionalFields = this.Options.Query.AdditionalAttributes != null ? "," + this.Options.Query.AdditionalAttributes.join(",") : "";
			Query.SetAttributesList("RUIDEX," + this.Options.DuplicateKeyControls.join(",") + "," + this.Options.ControlsToCheck.join(",") + additionalFields);

			Query.SetSearchInArchive(this.Options.Query.SearchInArchive);
			if (Query.MoveFirst())
			{
				var rec = Query.MoveNext();
				while (rec && this.duplicateList.length < this.Options.MaxReturnedDuplicates)
				{
					this.AddDuplicateToResult(rec);
					rec = Query.MoveNext();
				}
			}
		},

		/**
		* Construct the Duplicate object and add it to duplicateList array
		*
		* @param {record} rec The record of a duplicate to add to the result list
		*/
		AddDuplicateToResult: function (rec)
		{
			var vars = rec.GetUninheritedVars();
			var cd_RUIDEX = vars.GetValue_String("RUIDEX", 0);
			if (!this.IsRUIDEXExist(cd_RUIDEX))
			{
				var duplicateItem =
				{
					RUIDEX: cd_RUIDEX,
					duplicateKeys: {},
					controlsToCheck: {},
					additionalAttributes: {}
				};

				var i;
				for (i = 0; i < this.Options.DuplicateKeyControls.length; i++)
				{
					duplicateItem.duplicateKeys[this.Options.DuplicateKeyControls[i]] = vars.GetValue_String(this.Options.DuplicateKeyControls[i], 0);
				}
				for (i = 0; i < this.Options.ControlsToCheck.length; i++)
				{
					duplicateItem.controlsToCheck[this.Options.ControlsToCheck[i]] = vars.GetValue_String(this.Options.ControlsToCheck[i], 0);
				}
				for (i = 0; i < this.Options.Query.AdditionalAttributes.length; i++)
				{
					duplicateItem.additionalAttributes[this.Options.Query.AdditionalAttributes[i]] = vars.GetValue_String(this.Options.Query.AdditionalAttributes[i], 0);
				}

				this.duplicateList.push(duplicateItem);
			}
		},

		/**
		* Look for duplicate check based on the defined options
		*
		* @param {string[]} aDuplicateKeyControls List of the controls which contains the key
		* @param {string[]} aControlsToCheck List of the controls name to check
		* @param {Options.Query} mQueryOptions Specifics options for the query
		* @param {int} iGroupSize Defines the permutation wanted among the aDuplicateKeyControls
		*
		* @return {string[]} The duplicates values formatted (RUIDEX|controlOne|controlTwo|controlThree)
		*/
		CheckDuplicate: function (aDuplicateKeyControls, aControlsToCheck, mQueryOptions, iGroupSize)
		{
			this.InitCheckDuplicate(aDuplicateKeyControls, aControlsToCheck, mQueryOptions);

			if (iGroupSize !== null && iGroupSize > 0 && Variable.GetValueAsString(this.Options.DoNotCheckVariableName) !== "1")
			{
				var sDuplicateKeyFilter = this.BuildDuplicateKeyFilter();
				if (sDuplicateKeyFilter)
				{
					Log.Info("Duplicate key filter : " + sDuplicateKeyFilter);
					var aControlToCheckFilter = this.BuildControlToCheckFilter(iGroupSize);
					Log.Info("ControlToCheckFilter: " + aControlToCheckFilter);
					if (aControlToCheckFilter)
					{
						this.QueryForDuplicate(sDuplicateKeyFilter, aControlToCheckFilter);
					}
				}
			}

			return this.duplicateList;
		}
	};

	return DuplicateCheck;
});