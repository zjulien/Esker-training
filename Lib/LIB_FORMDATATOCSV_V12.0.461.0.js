/* LIB_DEFINITION{
  "name": "Lib_FormDataToCSV_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.AddLib("FormDataToCSV", function ()
{
	var FormDataToCSV = {

		// Separator used between csv items in the line
		g_csvSeparator: ";",

		// if values need quoting use this character
		g_csvQuoted: "\"",

		// The global csv stream we will build
		g_csvStream: "",

		// The cumulative amount for each tax code in the invoice
		g_taxAmountsArray: {},

		FlexibleFormNumber2DBNumber: function (inputNumber, nDecimals)
		{
			if (inputNumber === "")
			{
				return "";
			}
			var n = parseFloat(inputNumber);
			if (isNaN(n))
			{
				n = 0;
			}
			if (nDecimals !== undefined)
			{
				n = n.toFixed(nDecimals);
			}
			return n.toString();
		},

		FlexibleFormDate2DBDate: function (date)
		{
			// Assuming input format is yyyy-mm-dd
			var result = "";
			if (date && typeof date === "string" && date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/))
			{
				result = date.substr(8, 2) + date.substr(5, 2) + date.substr(0, 4);
			}
			return result;
		},

		normalizeLineNumber: function (line)
		{
			var txtidx;
			if (line > 9)
			{
				if (line > 99)
				{
					txtidx = "" + line;
				}
				else
				{
					txtidx = "0" + line;
				}
			}
			else
			{
				txtidx = "00" + line;
			}
			return txtidx;
		},

		AddStringToCsv: function (text, newRow)
		{
			if (!newRow)
			{
				this.g_csvStream += this.g_csvSeparator;
			}
			text = text.replace(/[\n\r]/g, "");
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
					text = this.FlexibleFormDate2DBDate(value);
				}
				else if (type === "number")
				{
					text = this.FlexibleFormNumber2DBNumber(value, 2);
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

		/**
		* Get the informations about the vendor
		* @param {object} : the data of the invoice currently exported
		* @return {object} : An object with the informations about the vendor
		**/
		GetVendorInfo: function (dataSrc)
		{
			var vendorInfo =
			{
				CompanyCode: dataSrc.GetValue("CompanyCode__"),
				Account: "",
				Number: dataSrc.GetValue("VendorNumber__"),
				TaxSystem: "",
				ParafiscalTax: false,
				SupplierDue: "",
				Currency: ""
			};

			var query = Process.CreateQuery();
			query.SetSpecificTable("AP - Vendors__");
			query.SetAttributesList("GeneralAccount__, TaxSystem__, Currency__, ParafiscalTax__, SupplierDue__");
			query.SetFilter("(&(Number__=" + dataSrc.GetValue("VendorNumber__") + ")(CompanyCode__=" + dataSrc.GetValue("CompanyCode__") + "))");

			if (query.MoveFirst())
			{
				var vendorRec = query.MoveNextRecord();
				if (vendorRec)
				{
					var vendorInfoVars = vendorRec.GetVars();
					vendorInfo.Account = vendorInfoVars.GetValue_String("GeneralAccount__", 0);
					vendorInfo.TaxSystem = vendorInfoVars.GetValue_String("TaxSystem__", 0);
					vendorInfo.Currency = vendorInfoVars.GetValue_String("Currency__", 0);
					vendorInfo.ParafiscalTax = vendorInfoVars.GetValue_Long("ParafiscalTax__", 0) === 1;
					vendorInfo.SupplierDue = vendorInfoVars.GetValue_String("SupplierDue__", 0);
				}
				else
				{
					Log.Error("Unable to retrieve vendor informations : " + Query.GetLastErrorMessage());
				}
			}

			return vendorInfo;
		},

		/**
		* Get the associated tax account from a specific tax code for a vendor
		* @param {string} taxCode
		* @param {object} vendorInfo - The VendorInfo object containing the informations about the vendor
		* @return {string} A string with the account associated with the tax code for this vendor
		**/
		GetTaxAccountFromTaxCode: function (taxCode, vendorInfo)
		{
			if (!vendorInfo)
			{
				return "";
			}

			var taxAccount = "";
			var query = Process.CreateQuery();
			query.SetSpecificTable("AP - Tax codes__");
			var queryFilter = "(&(|(CompanyCode__=" + vendorInfo.CompanyCode + ")(CompanyCode__=)(CompanyCode__!=*))(TaxCode__=" + taxCode + ")";
			if (vendorInfo.ParafiscalTax)
			{
				queryFilter += "(TaxType__=TX2))";
			}
			else
			{
				queryFilter += "(TaxType__=TX1))";
			}

			query.SetFilter(queryFilter);

			var attributeName;
			if (vendorInfo.SupplierDue === "TE")
			{
				attributeName = "TaxAccountForCollection__";
			}
			else
			{
				attributeName = "TaxAccount__";
			}
			query.SetAttributesList(attributeName);

			if (query.MoveFirst())
			{
				var taxCodeRec = query.MoveNextRecord();
				if (taxCodeRec)
				{
					var taxCodeVars = taxCodeRec.GetVars();
					taxAccount = taxCodeVars.GetValue_String(attributeName, 0);
				}
			}

			return taxAccount;
		},

		ClearTaxAmounts: function ()
		{
			this.g_taxAmountsArray = {};
		},

		AddTaxAmount: function (taxCode, taxAmount)
		{
			taxAmount = parseFloat(taxAmount);
			if (!taxAmount)
			{
				taxAmount = 0;
			}
			// Check if current tax code already exists
			if (taxCode)
			{
				if (this.g_taxAmountsArray[taxCode])
				{
					this.g_taxAmountsArray[taxCode].taxAmount += taxAmount;
				}
				else
				{
					this.g_taxAmountsArray[taxCode] = { "taxAmount": taxAmount };
				}
			}
		},

		AddVendorLine: function (dataSrc, vendorInfo)
		{
			// "CompanyCode";"V";"PostingDate(ISO)";"VendorAccnt";"VendorNumber";"DueDate";"D|C";"Amount";"";"Currency";"InvoiceNumber";"";""
			this.AddDataToCsv(dataSrc, "CompanyCode__", "string", true);
			this.AddStringToCsv("V", false);
			this.AddDataToCsv(dataSrc, "PostingDate__", "string", false);
			this.AddStringToCsv(vendorInfo.Account, false);
			this.AddDataToCsv(dataSrc, "VendorNumber__", "string", false);
			this.AddDataToCsv(dataSrc, "DueDate__", "string", false);

			var invoiceAmount = dataSrc.GetValue("InvoiceAmount__");
			// Vendor account is credited for invoices and debited for credit notes
			if (invoiceAmount < 0)
			{
				this.AddStringToCsv("D", false);
			}
			else
			{
				this.AddStringToCsv("C", false);
			}
			this.AddStringToCsv(this.FlexibleFormNumber2DBNumber(Math.abs(invoiceAmount), 2), false);
			this.AddStringToCsv("", false);
			this.AddDataToCsv(dataSrc, "InvoiceCurrency__", "string", false);
			this.AddDataToCsv(dataSrc, "InvoiceNumber__", "string", false);
			this.AddStringToCsv("", false);
			this.AddStringToCsv("", false);

			this.setEOL();
		},

		AddInvoiceLines: function (dataSrc)
		{
			// "CompanyCode";"I";"PostingDate(ISO)";"GLAccount";LineDescription;"";"D|C";"Amount";"Quantity";"Currency";"";"OrderNumber";"OrderItemNumber"
			var itemTable = dataSrc.GetTable("LineItems__");
			var itemCount = itemTable.GetItemCount();
			for (var index = 0; index < itemCount; index++)
			{
				var item = itemTable.GetItem(index);
				this.AddDataToCsv(dataSrc, "CompanyCode__", "string", true);
				this.AddStringToCsv("I", false);
				this.AddDataToCsv(dataSrc, "PostingDate__", "string", false);
				this.AddDataToCsv(item, "GLAccount__", "string", false);
				this.AddDataToCsv(item, "Description__", "string", false);
				this.AddStringToCsv("", false);

				var lineAmount = item.GetValue("Amount__");
				if (lineAmount < 0)
				{
					this.AddStringToCsv("C", false);
				}
				else
				{
					this.AddStringToCsv("D", false);
				}
				this.AddStringToCsv(this.FlexibleFormNumber2DBNumber(Math.abs(lineAmount), 2), false);
				this.AddDataToCsv(item, "Quantity__", "number", false);
				this.AddDataToCsv(dataSrc, "InvoiceCurrency__", "string", false);
				this.AddStringToCsv("", false);
				this.AddDataToCsv(item, "OrderNumber__", "string", false);
				this.AddDataToCsv(item, "ItemNumber__", "string", false);
				this.setEOL();

				// Accumulate tax amounts for later
				this.AddTaxAmount(item.GetValue("TaxCode__"), item.GetValue("TaxAmount__"));
			}
		},

		AddTaxLines: function (dataSrc, vendorInfo)
		{
			// "CompanyCode";"T";"PostingDate(ISO)";"TaxAccnt";"TaxCode";"";"D|C";"Amount";"";"Currency";"";"";""
			for (var taxCode in this.g_taxAmountsArray)
			{
				this.AddDataToCsv(dataSrc, "CompanyCode__", "string", true);
				this.AddStringToCsv("T", false);
				this.AddDataToCsv(dataSrc, "PostingDate__", "string", false);

				this.AddStringToCsv(this.GetTaxAccountFromTaxCode(taxCode, vendorInfo), false);
				this.AddStringToCsv(taxCode, false);

				this.AddStringToCsv("", false);
				var taxAmount = this.g_taxAmountsArray[taxCode].taxAmount;
				if (taxAmount < 0)
				{
					this.AddStringToCsv("C", false);
				}
				else
				{
					this.AddStringToCsv("D", false);
				}
				this.AddStringToCsv(this.FlexibleFormNumber2DBNumber(Math.abs(taxAmount), 2), false);
				this.AddStringToCsv("", false);
				this.AddDataToCsv(dataSrc, "InvoiceCurrency__", "string", false);
				this.AddStringToCsv("", false);
				this.AddStringToCsv("", false);
				this.AddStringToCsv("", false);
				this.setEOL();
			}
		},

		// interface: all converters should implement the following methods

		/**
		* Returns the Header of the file (The header will be written first in the file)
		* @returns {string} The header of the file
		**/
		GetHeader: function ()
		{
			return ["CompanyCode", "Type", "PostingDate", "AccountNumber", "Description", "DueDate", "Direction", "Amount", "Quantity", "Currency", "InvoiceNumber", "OrderNumber", "OrderItemNumber"].join(this.g_csvSeparator) + "\r\n";
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
			this.ClearTaxAmounts();

			var vendorInfo = this.GetVendorInfo(dataSrc);
			this.AddVendorLine(dataSrc, vendorInfo);
			this.AddInvoiceLines(dataSrc, vendorInfo);
			this.AddTaxLines(dataSrc, vendorInfo);

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
			return "utf8";
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

	Lib.FormDataConverter.Register("Generic CSV", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_SAP", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_MSDynamicsNAV", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_MSDynamicsAX", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_OracleJDE", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_OracleEBS", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_OraclePeopleSoft", FormDataToCSV);
	Lib.FormDataConverter.Register("CSV_SAGE1000", FormDataToCSV);
	return FormDataToCSV;
});
