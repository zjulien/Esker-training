/* LIB_DEFINITION{
  "name": "Lib_FlexibleFormToXml_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library",
  "require": []
}*/

/**
 * Convert a FlexibleForm into XML
 * @namespace Lib.FlexibleFormToXML
 */
var Lib;
Lib.AddLib("FlexibleFormToXML", function ()
{
	/** ******************************* **/
	/** FLEXIBLE FORM TO XML SERIALIZER **/
	/** ******************************* **/

	/**
	* @namespace Lib.FlexibleFormToXML.ExportMode
	* @memberOf Lib.FlexibleFormToXML
	* @readonly
	* @property {Object} ExportMode Possible export mode
	* @property {Object} ExportMode.allExcept Export all fields except the excluded one (default)
	* @property {Object} ExportMode.onlyIncluded Only export included file
	*/
	var ExportMode =
	{
		/** Export all fields except the excluded one (default) */
		allExcept: 0,
		/** Only export included files */
		onlyIncluded: 1
	};

	/**
	 * @lends Lib.FlexibleFormToXML
	 */
	var FlexibleFormToXML =
	{
		/**
		* List the rules for flexible form inclusion or exclusion
		* @typedef FieldsRules
		* @memberOf Lib.FlexibleFormToXML
		* @property {string[]} includedFields list of included fields used
		* when exportMode = 0 (allExcept)
		* @property {string[]} excludedFields list of excluded fields used
		* when exportMode = 1 (onlyIncluded)
		*/

		/**
		* List of options for table behavior as follow
		* @typedef TablesRules
		* @memberOf Lib.FlexibleFormToXML
		* @property {Lib.FlexibleFormToXML.TablesRule[]} N/A Array of rules
		* @example [
		*		{ name: "ApproversList\_\_", requiredColumns: ["ApproverID\_\_"], excludedColumns: ["ApproverAction\_\_", "LineMarker\_\_", "WorkflowIndex\_\_", "WRKFIsGroup\_\_"] },
		*		{ name: "ExtractedLineItems\_\_", excludedFullTable: true },
		*		{
		*			name: "LineItems\_\_",
		*			excludedConditionalColumns:
		*			{
		*				fieldConditional: "LineType\_\_",
		*				conditionalTable:
		*				{
		*					PO:
		*					{
		*						excludedColumns: ["VendorNumber\_\_", "OpenAmount\_\_", "OpenQuantity\_\_", "ExpectedAmount\_\_", "ExpectedQuantity\_\_", "PartNumber\_\_", "UnitPrice\_\_", "Group\_\_",
		*						"Buyer\_\_", "Receiver\_\_", "WBSElement\_\_", "WBSElementID\_\_", "TradingPartner\_\_"]
		*					},
		*					GL:
		*					{
		*						excludedColumns: ["VendorNumber\_\_", "OpenAmount\_\_", "OpenQuantity\_\_", "ExpectedAmount\_\_", "ExpectedQuantity\_\_", "PartNumber\_\_", "UnitPrice\_\_", "Group\_\_",
		*						"Buyer\_\_", "Receiver\_\_", "ItemNumber\_\_", "OrderNumber\_\_", "GoodsReceipt\_\_", "DeliveryNote\_\_", "Quantity\_\_", "WBSElement\_\_", "WBSElementID\_\_", "TradingPartner\_\_"]
		*					}
		*				}
		*			}
		*		},
		*		{ name: "BankDetails\_\_", excludedFullTable: true }
		*	]
		*
		*/

		/**
		* List of options for table behavior as follow
		* @typedef TablesRule
		* @memberOf Lib.FlexibleFormToXML
		* @property {string} name table name (ex. "LineItems\_\_")
		* @property {boolean} includedFullTable true/false, specify if the whole table should be included from generation even if there are no lines (to define table columns).
		* Used when exportMode = 1 (onlyIncluded).
		* @property {boolean} excludedFullTable true/false, specify if the whole table should be excluded from generation.
		* Used when exportMode = 0 (allExcept).
		* @property {Lib.FlexibleFormToXML.excludedColumns} excludedColumns list of table columns to exclude. Used when exportMode = 0 (allExcept).
		* Exclusive with option excludedConditionalColumns
		* @property {string[]} includedColumns list of table columns which columns are always added in generation.
		* Used when exportMode = 1 (onlyIncluded)
		* @property {string[]} requiredColumns list of table columns which values are required for generation. When the table line has an empty value for required columns the line is not exported.
		* Option used in both export modes (onlyincluded and allExcept)
		* @property {Lib.FlexibleFormToXML.excludedConditionalColumn[]} excludedConditionalColumns list of table columns to exclude after an equal comparison to a specified field.
		* Exclusive with option excludedColumns
		* @example { name: "ApproversList\_\_", requiredColumns: ["ApproverID\_\_"], excludedColumns: ["ApproverAction\_\_", "LineMarker\_\_", "WorkflowIndex\_\_", "WRKFIsGroup\_\_"] }
		*/

		/**
		* excludedConditionalColumn property defintion
		* @typedef excludedConditionalColumn
		* @memberOf Lib.FlexibleFormToXML
		* @property {string} fieldConditional The column name used to compare values for each line
		* @property {object} conditionnalTable  "Value to compare"  : {@link Lib.FlexibleFormToXML.excludedColumns}
		* @example {
		*			name: "LineItems\_\_",
		*			excludedConditionalColumns:
		*			{
		*				fieldConditional: "LineType\_\_",
		*				conditionalTable:
		*				{
		*					PO:
		*					{
		*						excludedColumns: ["VendorNumber\_\_", "OpenAmount\_\_", "OpenQuantity\_\_", "ExpectedAmount\_\_", "ExpectedQuantity\_\_", "PartNumber\_\_", "UnitPrice\_\_", "Group\_\_",
		*						"Buyer\_\_", "Receiver\_\_", "WBSElement\_\_", "WBSElementID\_\_", "TradingPartner\_\_"]
		*					},
		*					GL:
		*					{
		*						excludedColumns: ["VendorNumber\_\_", "OpenAmount\_\_", "OpenQuantity\_\_", "ExpectedAmount\_\_", "ExpectedQuantity\_\_", "PartNumber\_\_", "UnitPrice\_\_", "Group\_\_",
		*						"Buyer\_\_", "Receiver\_\_", "ItemNumber\_\_", "OrderNumber\_\_", "GoodsReceipt\_\_", "DeliveryNote\_\_", "Quantity\_\_", "WBSElement\_\_", "WBSElementID\_\_", "TradingPartner\_\_"]
		*					}
		*				}
		*			}
		*		}
		*
		*/

		/**
		* excludedColumns property definition
		* @typedef excludedColumns
		* @memberOf Lib.FlexibleFormToXML
		* @property {Array<string>} excludedColumns list of columns to exclude
		* @example { excludedColumns : ["VendorNumber\_\_", "OpenAmount\_\_", "OpenQuantity\_\_", "ExpectedAmount\_\_", "ExpectedQuantity\_\_", "PartNumber\_\_", "UnitPrice\_\_", "Group\_\_", "Buyer\_\_", "Receiver\_\_", "WBSElement\_\_", "WBSElementID\_\_", "TradingPartner\_\_"] }
		*/


		/** helper for flexibleFormToXML
		 * @param {string} xmlEncoding possible values are "UTF-8" (8 bit UTF-8) or "UTF-16" (16 bit Unicode)
		 * @param {string} rootElementName name of the root element of the generated XML
		 * @param {Lib.FlexibleFormToXML.FieldsRules} FieldsRules List the rules for flexible form inclusion or exclusion
		 * @param {Lib.FlexibleFormToXML.TablesRules[]} tableOptions: list of options for table behavior as follow
		 * @param {string[]} keepFirstFields list of fields known to be multivalued, but for which we want to keep only the first value (the separator is always a comma)
		 * @param {string[]} modifiedNodeNameMappings list of names that will replace default names of fields in the resulting XML
		 * @param {boolean} keepEmptyFields keep empty fields in the XML, which will produc nodes with no values. True by default.
		 * @param {object} fieldValuesMapping list of fields containing values to replace in the resulting XML
		 */
		setOptions: function (xmlEncoding, rootElementName, fieldsRules, tableOptions, dataSrc, keepFirstFields, exportMode, modifiedNodeNameMappings, keepEmptyFields, fieldValuesMapping)
		{
			FlexibleFormToXML.exportMode = ExportMode.allExcept;
			if (exportMode)
			{
				FlexibleFormToXML.exportMode = exportMode;
			}

			FlexibleFormToXML.xmlEncoding = xmlEncoding;
			FlexibleFormToXML.rootElementName = rootElementName;
			if (Object.prototype.toString.call(fieldsRules) === '[object Array]')
			{
				FlexibleFormToXML.excludedFields = fieldsRules;
				FlexibleFormToXML.includedFields = null;
			}
			else if (fieldsRules !== null && typeof fieldsRules === 'object')
			{
				FlexibleFormToXML.includedFields = fieldsRules.includedFields;
				FlexibleFormToXML.excludedFields = fieldsRules.excludedFields;
			}
			FlexibleFormToXML.tableOptions = tableOptions;
			if (dataSrc)
			{
				FlexibleFormToXML.dataSrc = dataSrc;
			}
			else
			{
				FlexibleFormToXML.dataSrc = Data;
			}
			if (modifiedNodeNameMappings)
			{
				FlexibleFormToXML.modifiedNodeNameMappings = modifiedNodeNameMappings;
			}
			FlexibleFormToXML.keepFirstFields = keepFirstFields;
			FlexibleFormToXML.keepEmptyFields = true;
			if (keepEmptyFields !== null && typeof keepEmptyFields !== "undefined")
			{
				FlexibleFormToXML.keepEmptyFields = keepEmptyFields;
			}
			FlexibleFormToXML.fieldValuesMapping = fieldValuesMapping;
		},

		/* Fields management */
		fieldIsExportable: function (fieldName)
		{
			switch (FlexibleFormToXML.exportMode)
			{
				case ExportMode.onlyIncluded:
					return FlexibleFormToXML.IsFieldIncluded(fieldName);
				case ExportMode.allExcept:
				default:
					return !FlexibleFormToXML.IsFieldExclude(fieldName);
			}
		},

		AddFields: function ()
		{
			var xmlDoc = Helpers.XML.CreateXmlDocument();
			for (var i = 0; i < FlexibleFormToXML.dataSrc.GetNbFields(); i++)
			{
				var fieldName = FlexibleFormToXML.dataSrc.GetFieldName(i);
				var xmlFieldName = FlexibleFormToXML.translate(fieldName);

				if (FlexibleFormToXML.fieldIsExportable(fieldName))
				{
					var value = FlexibleFormToXML.getFieldValue(FlexibleFormToXML.dataSrc, fieldName);
					value = FlexibleFormToXML.mapFieldValue(fieldName, value);
					FlexibleFormToXML.AddNode(xmlDoc, xmlFieldName, value);
				}
			}
			return xmlDoc.toString();
		},

		IsFieldIncluded: function (fieldName)
		{
			if (!FlexibleFormToXML.includedFields || FlexibleFormToXML.includedFields.length === 0)
			{
				return false;
			}

			return FlexibleFormToXML.includedFields.indexOf(fieldName) !== -1;
		},

		IsFieldExclude: function (fieldName)
		{
			if (!FlexibleFormToXML.excludedFields || FlexibleFormToXML.excludedFields.length === 0)
			{
				return false;
			}

			return FlexibleFormToXML.excludedFields.indexOf(fieldName) !== -1;
		},

		GetFirstValue: function (values)
		{
			if (values && typeof values === "string")
			{
				return values.split(",")[0];
			}
			return values;
		},

		/* Tables management */
		IsWholeTableIncluded: function (tableName)
		{
			if (FlexibleFormToXML.tableOptions === null || FlexibleFormToXML.tableOptions.length === 0)
			{
				return false;
			}
			var table = FlexibleFormToXML.GetMatchingTable(tableName);
			// Check if all the table is exclude
			if (table && table.includedFullTable)
			{
				return true;
			}

			return false;
		},

		IsTableIncluded: function (tableName, columnName)
		{
			if (FlexibleFormToXML.tableOptions === null || FlexibleFormToXML.tableOptions.length === 0)
			{
				return false;
			}
			var table = FlexibleFormToXML.GetMatchingTable(tableName);
			// Check if all the table is exclude
			if (!table)
			{
				return false;
			}
			else if (table.includedFullTable || !columnName)
			{
				return true;
			}

			return table.includedColumns && table.includedColumns.indexOf(columnName) !== -1;
		},

		IsTableExclude: function (tableName, columnName)
		{
			if (FlexibleFormToXML.tableOptions === null || FlexibleFormToXML.tableOptions.length === 0)
			{
				return false;
			}

			var table = FlexibleFormToXML.GetMatchingTable(tableName);
			if (table)
			{
				// Check if all the table is exclude
				if (table.excludedFullTable)
				{
					return true;
				}

				// Excluded only specified columns (if excludedConditionalColumns is defined don't exclude column directly)
				// It will be done only for the line export
				if (table.excludedConditionalColumns &&
					table.excludedConditionalColumns.conditionalTable &&
					table.excludedConditionalColumns.fieldConditional)
				{
					return false;
				}
				return table.excludedColumns && table.excludedColumns.indexOf(columnName) !== -1;
			}
			return false;
		},

		tableIsExportable: function (tableName, columnName)
		{
			switch (FlexibleFormToXML.exportMode)
			{
				case ExportMode.onlyIncluded:
					return FlexibleFormToXML.IsTableIncluded(tableName, columnName);
				case ExportMode.allExcept:
				default:
					return !FlexibleFormToXML.IsTableExclude(tableName, columnName);
			}
		},

		AddTables: function (xmlFile, condition)
		{
			//Lucas todo : add tables to conditions
			for (var i = 0; i < FlexibleFormToXML.dataSrc.GetNbTables(); i++)
			{
				var tableName = FlexibleFormToXML.dataSrc.GetTableName(i);
				if (FlexibleFormToXML.tableIsExportable(tableName))
				{
					FlexibleFormToXML.AddTable(xmlFile, tableName, condition);
				}
			}
		},

		AddTable: function (xmlFile, tableName, condition)
		{
			var table = FlexibleFormToXML.dataSrc.GetTable(tableName);

			// List all available columns
			var columns = [];
			for (var i = 0; i < FlexibleFormToXML.dataSrc.GetNbColumns(tableName); i++)
			{
				var columnName = FlexibleFormToXML.dataSrc.GetColumnName(tableName, i);
				if (FlexibleFormToXML.tableIsExportable(tableName, columnName))
				{
					columns.push(columnName);
				}
			}

			// Check if at least one column is to export
			if (columns.length > 0)
			{
				TemporaryFile.Append(xmlFile, "<" + FlexibleFormToXML.NormalizeElementName(FlexibleFormToXML.translate(tableName)) + ">");
				var requireTable = FlexibleFormToXML.GetMatchingTable(tableName);
				var data;
				if (FlexibleFormToXML.IsWholeTableIncluded(tableName) && table.GetItemCount() === 0)
				{
					// Specific case we want to add the table with an empty row if the table is included
					data = FlexibleFormToXML.ExtractDataFromLine(tableName, null, columns, requireTable ? requireTable.requiredColumns : null, requireTable ? requireTable.includedColumns : null, true);
					FlexibleFormToXML.addItemNode(xmlFile, data, true, condition);
				}
				else
				{
					// Add all lines with available columns to XML
					for (var itemIdx = 0; itemIdx < table.GetItemCount(); itemIdx++)
					{
						if (FlexibleFormToXML.checkLineaddConditions(tableName, table.GetItem(itemIdx), condition))
						{
							data = FlexibleFormToXML.ExtractDataFromLine(tableName, table.GetItem(itemIdx), columns, requireTable ? requireTable.requiredColumns : null, requireTable ? requireTable.includedColumns : null);
							FlexibleFormToXML.addItemNode(xmlFile, data, false);
						}
					}
				}
				TemporaryFile.Append(xmlFile, "</" + FlexibleFormToXML.NormalizeElementName(FlexibleFormToXML.translate(tableName)) + ">");
			}
		},

		GetMatchingTable: function (tableName)
		{
			if (FlexibleFormToXML.tableOptions)
			{
				var max = FlexibleFormToXML.tableOptions.length;
				for (var i = 0; i < max; i++)
				{
					var item = FlexibleFormToXML.tableOptions[i];
					if (item && item.name === tableName)
					{
						return item;
					}
				}
			}

			return null;
		},

		checkLineaddConditions: function (tableName, data, condition)
		{
			if (condition && condition[tableName])
			{
				var c = condition[tableName];
				for (var i = 0; i < c.length; i++)
				{
					var field = c[i].field;
					var fieldValue = data.GetValue(field);
					if (fieldValue)
					{
						if (c[i].value !== fieldValue)
						{
							Log.Info("[Lib_FlexibleFormToXml] : removed line item because condition on field '" + field + "' : " + c[i].value + " != " + fieldValue);
							return false;
						}
					}
				}
			}
			return true;
		},

		addItemNode: function (xmlFile, data, force)
		{
			var xmlDoc = Helpers.XML.CreateXmlDocument();
			if (data)
			{
				var lineNode = xmlDoc.AddElement(FlexibleFormToXML.translate("item"));
				for (var column in data)
				{
					if (force || data.hasOwnProperty(column))
					{
						FlexibleFormToXML.AddNode(lineNode, FlexibleFormToXML.translate(column), data.hasOwnProperty(column) ? data[column] : null);
					}
				}
				TemporaryFile.Append(xmlFile, xmlDoc.toString());
			}
		},

		translate: function (name)
		{
			if (FlexibleFormToXML.modifiedNodeNameMappings)
			{
				if (FlexibleFormToXML.modifiedNodeNameMappings[name])
				{
					return FlexibleFormToXML.modifiedNodeNameMappings[name];
				}
			}
			return name;
		},

		mapFieldValue: function (name, value)
		{
			if (FlexibleFormToXML.fieldValuesMapping && typeof FlexibleFormToXML.fieldValuesMapping[name] !== "undefined")
			{
				// If the mapping depend of the field value.
				if (typeof FlexibleFormToXML.fieldValuesMapping[name] === "object" && typeof FlexibleFormToXML.fieldValuesMapping[name][value] !== "undefined")
				{
					return FlexibleFormToXML.fieldValuesMapping[name][value];
				}
				// Else the value is returned anyway.
				else if (typeof FlexibleFormToXML.fieldValuesMapping[name] !== "object")
				{
					return FlexibleFormToXML.fieldValuesMapping[name];
				}
			}
			return value;
		},

		/**
		 * return the value for the specified field.
		 * If the data is translatable, returned the translated value.
		 * @param {Data} dataSource Data or item object used to call the GetValue function
		 * @param {string} fieldName The name of the field to get
		 * @returns {formValue} Result of Data.GetValue(fieldName)
		 */
		getFieldValue: function (dataSource, fieldName)
		{
			var value = dataSource.GetValue(fieldName);

			if (value && dataSource.IsLazyTranslatable && dataSource.IsLazyTranslatable(fieldName))
			{
				value = Language.TranslateLazyTranslation(value);
			}

			return value;
		},

		getExcludedConditionalColumns: function (table, lineItem)
		{
			if (table &&
				table.excludedConditionalColumns &&
				table.excludedConditionalColumns.conditionalTable &&
				table.excludedConditionalColumns.fieldConditional)
			{
				var switchExcludingValue = lineItem.GetValue(table.excludedConditionalColumns.fieldConditional);
				if (table.excludedConditionalColumns.conditionalTable[switchExcludingValue])
				{
					return table.excludedConditionalColumns.conditionalTable[switchExcludingValue];
				}
			}

			return null;
		},

		isColumnDynamicallyExcluded: function (dynamicColumnsToExclude, columnName)
		{
			return dynamicColumnsToExclude && dynamicColumnsToExclude.excludedColumns &&
				dynamicColumnsToExclude.excludedColumns.indexOf(columnName) !== -1;
		},

		isDataExistForLine: function (requiredColumns, includedColumns, columnName, columnValue)
		{
			var checkColumn = true;
			if (includedColumns && includedColumns.indexOf(columnName) !== -1)
			{
				return true;
			}

			if (requiredColumns)
			{
				checkColumn = requiredColumns.indexOf(columnName) !== -1;
			}

			// If not required and value set
			if (checkColumn && columnValue && columnValue.toString().length > 0)
			{
				return true;
			}

			return false;
		},

		ExtractDataFromLine: function (tableName, lineItem, exportColumns, requiredColumns, includedColumns, forceExport)
		{
			var data = {};
			var dataExist = false;

			// Resolve dynamic columns exclude if defined
			var table = FlexibleFormToXML.GetMatchingTable(tableName);
			var dynamicColumnsToExclude = FlexibleFormToXML.getExcludedConditionalColumns(table, lineItem);

			for (var colIdx = 0; colIdx < exportColumns.length; colIdx++)
			{
				var columnName = exportColumns[colIdx];
				var columnValue = lineItem ? FlexibleFormToXML.getFieldValue(lineItem, columnName) : null;
				columnValue = FlexibleFormToXML.mapFieldValue(tableName + "." + columnName, columnValue);

				if (FlexibleFormToXML.isColumnDynamicallyExcluded(dynamicColumnsToExclude, columnName))
				{
					// skip the current column if dynamic exclusion is defined
					continue;
				}

				data[columnName] = columnValue;

				if (!dataExist && (forceExport || FlexibleFormToXML.isDataExistForLine(requiredColumns, includedColumns, columnName, columnValue)))
				{
					dataExist = true;
				}
			}

			// If no data exist for this line, return null to avoid empty line in XML
			if (dataExist)
			{
				return data;
			}

			return null;
		},

		/* XML management */
		NormalizeElementName: function (name)
		{
			// Remove last two undescore in controls name
			var rx = /(.*)__/;
			var res = rx.exec(name);

			if (res && res.length > 1)
			{
				return res[1];
			}

			return name;
		},

		transformValueToText: function (name, value)
		{
			var text;

			if (typeof value === "boolean")
			{
				text = value ? "1" : "0";
			}
			else if (value instanceof Date)
			{
				text = Helpers.Date.DateToShortFormat(value);
			}
			else if (FlexibleFormToXML.keepFirstFields && FlexibleFormToXML.keepFirstFields.indexOf(name) !== -1)
			{
				text = this.GetFirstValue(value);
			}
			else
			{
				text = value;
			}
			return text;
		},

		AddNode: function (parentNode, name, value)
		{
			var text = this.transformValueToText(name, value);
			if (text || FlexibleFormToXML.keepEmptyFields)
			{
				var node = parentNode.AddElement(FlexibleFormToXML.NormalizeElementName(name));
				node.AddText(text);
			}
		},

		GetXML: function (customNodesCallback, defaultIndentation)
		{
			var xmlDocument = Helpers.XML.CreateXmlDocument();
			if (FlexibleFormToXML.xmlEncoding === "UTF-8")
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0" encoding="UTF-8"');
			}
			else if (FlexibleFormToXML.xmlEncoding === "UTF-16")
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0" encoding="UTF-16"');
			}
			else
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0"');
			}

			// Create root with RUID
			var root = xmlDocument.AddElement(FlexibleFormToXML.rootElementName);
			root.AddAttribute("RUID", FlexibleFormToXML.dataSrc.GetValue("RUIDEX"));

			FlexibleFormToXML.AddFields(root);
			FlexibleFormToXML.AddTables(root, null);

			if (typeof customNodesCallback === "function")
			{
				customNodesCallback(FlexibleFormToXML, root);
			}

			return xmlDocument.toString(false, defaultIndentation);
		},

		GetXMLFile: function (xmlFile, customNodesCallback, defaultIndentation, condition, extraId)
		{
			var xmlDocument = Helpers.XML.CreateXmlDocument();
			if (FlexibleFormToXML.xmlEncoding === "UTF-8")
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0" encoding="UTF-8"');
			}
			else if (FlexibleFormToXML.xmlEncoding === "UTF-16")
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0" encoding="UTF-16"');
			}
			else
			{
				xmlDocument.AddProcessingInstruction('xml version="1.0"');
			}

			TemporaryFile.Append(xmlFile, xmlDocument.toString());
			if (!(extraId && extraId.length > 0))
			{
				extraId = "";
			}
			else
			{
				extraId = Sys.Helpers.Object.EscapeValueForXML(extraId);
			}
			TemporaryFile.Append(xmlFile, "<" + FlexibleFormToXML.rootElementName + " " + FlexibleFormToXML.translate("RUID") + "=\"" + FlexibleFormToXML.dataSrc.GetValue("RUIDEX") + extraId + "\">");

			//invoice header fields
			TemporaryFile.Append(xmlFile, FlexibleFormToXML.AddFields());

			//invoice tables
			FlexibleFormToXML.AddTables(xmlFile, condition);

			//customNodesCallback
			if (typeof customNodesCallback === "function")
			{
				customNodesCallback(FlexibleFormToXML, xmlFile);
			}

			TemporaryFile.Append(xmlFile, "</" + FlexibleFormToXML.rootElementName + ">");
		}
	};

	return FlexibleFormToXML;
});