/* LIB_DEFINITION{
  "name": "Lib_FormDataToPaymentApproval_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.AddLib("FormDataToPaymentApproval", function ()
{
	var FormDataToPaymentApproval = {

		// Separator used between csv items in the line
		g_csvSeparator: ",",

		// if values need quoting use this character
		g_csvQuoted: "\"",

		// The global csv stream we will build
		g_csvStream: "",

		// EOL termination character stream
		g_newLineChars: "\r\n",

		g_withHeader: true,

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
					text = value.toString();
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
			this.g_csvStream += this.g_newLineChars;
		},

		GetLastApprover: function (dataSrc)
		{
			var approvalWorkflow = dataSrc.GetTable("ApproversList__");
			var approverCount = approvalWorkflow.GetItemCount();
			// search for the last approver
			for (var i = approverCount - 1; i > 0; i--)
			{
				var item = approvalWorkflow.GetItem(i);
				if (item.GetValue("ApproverAction__") === "backToAP")
				{
					// no need to go before a backToAP
					return null;
				}

				if (item.GetValue("ApproverAction__") === "approve")
				{
					return item;
				}
			}
			return null;
		},

		// interface: all converters should implement the following methods

		/**
		* Returns the Header of the file (The header will be written first in the file)
		* @returns {string} The header of the file
		**/
		GetHeader: function ()
		{
			return ["Invoice number", "Vendor number", "Vendor name", "Invoice date", "Amount without tax", "Tax amount", "Currency", "Link", "Last approver name", "Last approval date"].join(this.g_csvSeparator) + this.g_newLineChars;
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
			this.AddDataToCsv(dataSrc, "InvoiceNumber__", "string", true);
			this.AddDataToCsv(dataSrc, "VendorNumber__", "string", false);
			this.AddDataToCsv(dataSrc, "VendorName__", "string", false);
			this.AddDataToCsv(dataSrc, "InvoiceDate__", "date", false);
			this.AddDataToCsv(dataSrc, "NetAmount__", "number", false);
			this.AddDataToCsv(dataSrc, "TaxAmount__", "number", false);
			this.AddDataToCsv(dataSrc, "InvoiceCurrency__", "string", false);
			this.AddDataToCsv(dataSrc, "ValidationUrl", "string", false);

			// Last approver and last approval date
			var lastApproverItem = this.GetLastApprover(dataSrc);
			if (lastApproverItem)
			{
				// Last approver
				this.AddDataToCsv(lastApproverItem, "Approver__", "string", false);

				//Last approval date
				this.AddDataToCsv(lastApproverItem, "ApprovalDate__", "date", false);
			}
			else
			{
				// Last approver
				this.AddStringToCsv("", false);

				//Last approval date
				this.AddStringToCsv("", false);
			}

			this.setEOL();
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

	Lib.FormDataConverter.Register("CSV_PaymentApproval", FormDataToPaymentApproval);
	return FormDataToPaymentApproval;
});
