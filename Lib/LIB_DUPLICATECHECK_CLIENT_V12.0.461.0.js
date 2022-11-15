///#GLOBALS Options Sys
/* LIB_DEFINITION{
  "scriptType": "CLIENT",
  "require": [
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil"
  ],
  "name": "Lib_DuplicateCheck_Client_V12.0.461.0"
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
		 * @static Lib.DuplicateCheck.Options
		 */
		Options:
		{
			/**
			* CustomScript CallBack
			* @type function
			* @default null
			*/
			CallBack: null,

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

			/** @class List the specifics options for the query */
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
		InitCheckDuplicate: function (aDuplicateKeyControls, aControlsToCheck, mQueryOptions, cCallBack)
		{
			this.duplicateList = [];

			this.Options.DuplicateKeyControls = aDuplicateKeyControls;
			this.Options.ControlsToCheck = aControlsToCheck;
			this.Options.CallBack = cCallBack;

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
			mQueryOptions.AdditionalAttributes = aAdditionalAttributes;
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
			if (controlValue !== null && controlValue !== undefined && controlValue instanceof Date)
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
			return Sys.Helpers.LdapUtil.FilterEqual(controlToCheck.name, controlToCheck.value).toString();
		},

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

		/**
		* Build the specific filter based on the fields to check and the alert level
		*
		* @param {integer} alertLevel The alert level (1, 2 or 3)
		* @return {string} The filter based on the fields to check and the alert level
		*/
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
			// Check if unique key exists (process created from the web has to be saved before having a unique key)
			var ruidEx = ProcessInstance.id;
			if (ruidEx)
			{
				filter += "(!(MSNEX=" + ruidEx.substring(ruidEx.indexOf(".") + 1) + "))";
			}
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

			return filter;
		},

		/**
		* Construct, call the query and fill the duplicateList variable
		*
		* @param {string} duplicateKeyFilter The key filter
		* @param {string} duplicateFilter The filter based on the values to check
		*/
		QueryForDuplicate: function (duplicateKeyFilter, duplicateFilter, queryOptions)
		{
			var table = ProcessInstance.id ? ProcessInstance.id : "";
			table = table.substring(0, table.indexOf("."));
			var filter = DuplicateCheck.BuildQueryFilter(duplicateKeyFilter, duplicateFilter);
			var sortOrder = queryOptions.SortOnControlName;
			var additionalFields = queryOptions.AdditionalAttributes != null && queryOptions.AdditionalAttributes.length != 0 ? "|" + queryOptions.AdditionalAttributes.join("|") : "";
			var attributes = "RUIDEX|" + this.Options.DuplicateKeyControls.join("|") + "|" + DuplicateCheck.Options.ControlsToCheck.join("|") + additionalFields;
			Query.DBQuery(DuplicateCheck.DuplicateQueryCallBack, table, attributes, filter, sortOrder + " ASC", DuplicateCheck.Options.MaxReturnedDuplicates, this);
		},

		DuplicateQueryCallBack: function (queryResult)
		{
			var err = queryResult.GetQueryError();
			if (err)
			{
				Log.Error("An error occured during the query");
				if (this.Options.CallBack)
				{
					this.Options.CallBack(null);
				}
			}
			else
			{
				this.AddDuplicatesToResult(queryResult);
			}
		},

		/**
		* Construct the Duplicate object and add it to duplicateList array
		*
		* @param {record} queryResult the result of the query
		*/
		AddDuplicatesToResult: function (queryResult)
		{
			var recordsCount = queryResult.GetRecordsCount();
			for (var index = 0; index < recordsCount; index++)
			{
				var cd_RUIDEX = queryResult.GetQueryValue("RUIDEX", index);
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
						duplicateItem.duplicateKeys[this.Options.DuplicateKeyControls[i]] = queryResult.GetQueryValue(this.Options.DuplicateKeyControls[i], index);
					}
					for (i = 0; i < this.Options.ControlsToCheck.length; i++)
					{
						duplicateItem.controlsToCheck[this.Options.ControlsToCheck[i]] = queryResult.GetQueryValue(this.Options.ControlsToCheck[i], index);
					}
					for (i = 0; i < this.Options.Query.AdditionalAttributes.length; i++)
					{
						duplicateItem.additionalAttributes[this.Options.Query.AdditionalAttributes[i]] = queryResult.GetQueryValue(this.Options.Query.AdditionalAttributes[i], index);
					}

					this.duplicateList.push(duplicateItem);
				}
			}

			if (this.Options.CallBack)
			{
				this.Options.CallBack(this.duplicateList);
			}
		},

		/**
		* Look for duplicate check based on the defined options
		*
		* @param {string[]} duplicateKeyControls List of the controls which contains the key
		* @param {string[]} controlsToCheck List of the controls name to check
		* @param {Options.Query} queryOptions Specifics options for the query
		* @param {int} iGroupSize Defines the permutation wanted among the aDuplicateKeyControls

		* @return {string[]} The duplicates values formatted (RUIDEX|controlOne|controlTwo|controlThree)
		*/
		CheckDuplicate: function (aDuplicateKeyControls, aControlsToCheck, mQueryOptions, iGroupSize, cCallBack)
		{
			this.InitCheckDuplicate(aDuplicateKeyControls, aControlsToCheck, mQueryOptions, cCallBack);

			var bQueryCalled = false;

			if (iGroupSize !== null && iGroupSize > 0 && Variable.GetValueAsString(this.Options.DoNotCheckVariableName) !== "1")
			{
				var sDuplicateKeyFilter = this.BuildDuplicateKeyFilter();
				if (sDuplicateKeyFilter)
				{
					var aControlToCheckFilter = this.BuildControlToCheckFilter(iGroupSize);
					if (aControlToCheckFilter)
					{
						this.QueryForDuplicate(sDuplicateKeyFilter, aControlToCheckFilter, mQueryOptions);
						bQueryCalled = true;
					}
				}
			}

			if (!bQueryCalled && this.Options.CallBack)
			{
				this.Options.CallBack([]);
			}
		}
	};

	return DuplicateCheck;
});