/* LIB_DEFINITION{
  "name": "Lib_FormDataToSAGE50_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.AddLib("FormDataToSAGE50", function ()
{
	var FormDataToSAGE50 = {

		// Separator used between csv items in the line
		g_csvSeparator: ",",

		// if values need quoting use this character
		g_csvQuoted: "\"",

		// The global csv stream we will build
		g_csvStream: "",

		AddStringToCsv: function (text, newRow)
		{
			if (!newRow)
			{
				this.g_csvStream += this.g_csvSeparator;
			}
			this.g_csvStream += this.g_csvQuoted + text + this.g_csvQuoted;
		},

		AddDataToCsv: function (data, dataName, type, newRow)
		{
			var text = null;
			var value = data.GetValue(dataName);
			if (value !== null)
			{
				if (type === "date")
				{
					text = Lib.FormDataToCSV.FlexibleFormDate2DBDate(value);
				}
				else if (type === "number")
				{
					text = Lib.FormDataToCSV.FlexibleFormNumber2DBNumber(value, 2);
				}
				else
				{
					text = value.toString();
				}
			}
			this.AddStringToCsv(text, newRow);
		},

		setEOL: function ()
		{
			this.g_csvStream += "\r\n";
		},

		// interface: all converters should implement the following methods

		/**
		* Returns the Header of the file (The header will be written first in the file)
		* @returns {string} The header of the file
		**/
		GetHeader: function ()
		{
			return "";
		},

		/**
		* Converts the dataSrc into a string to be written in the result file (after the header, and before the footer)
		* @param {object} dataSrc The Data object of the document to convert
		* @returns {string} A string containing the converted data
		**/
		Convert: function (dataSrc)
		{
			if (!dataSrc)
			{
				return null;
			}

			this.g_csvStream = "";

			var itemTable = dataSrc.GetTable("LineItems__");
			var itemCount = itemTable.GetItemCount();
			for (var index = 0; index < itemCount; index++)
			{
				var item = itemTable.GetItem(index);
				this.AddStringToCsv("PI", true);
				this.AddDataToCsv(dataSrc, "VendorNumber__", "string", false);
				this.AddDataToCsv(item, "GLAccount__", "string", false);
				this.AddStringToCsv(Lib.FormDataToCSV.normalizeLineNumber(index + 1), false);
				this.AddDataToCsv(dataSrc, "InvoiceDate__", "date", false);
				this.AddDataToCsv(dataSrc, "InvoiceNumber__", "string", false);
				this.AddStringToCsv(item.GetValue("Description__") + ";" + item.GetValue("OrderNumber__"), false);
				this.AddDataToCsv(item, "Amount__", "number", false);
				this.AddDataToCsv(item, "TaxCode__", "string", false);
				this.AddDataToCsv(item, "TaxAmount__", "number", false);
				this.setEOL();
			}

			return this.g_csvStream;
		},

		/**
		* Returns the extension of the generated file
		* @returns {string} The extension of the generated file
		**/
		GetExtension: function ()
		{
			return "csv";
		},

		/**
		* Returns the encoding of the generated file
		* @returns {string} The encoding of the generated file
		**/
		GetEncoding: function ()
		{
			return "ansi";
		},

		/**
		* Returns the end of line format of the generated file
		* @returns {int} The format of the end of line (0 for Unix, 1 for Windows)
		**/
		GetEOLFormat: function ()
		{
			return Lib.FormDataConverter.EOL.Windows;
		}
	};

	Lib.FormDataConverter.Register("CSV_SAGE50", FormDataToSAGE50);
	return FormDataToSAGE50;
});
