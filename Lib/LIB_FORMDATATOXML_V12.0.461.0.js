/* LIB_DEFINITION{
  "name": "Lib_FormDataToXML_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": []
}*/
var Lib;
Lib.AddLib("FormDataToXML", function ()
{
	function getExcludedFields(invoiceType)
	{
		var excludedFields = ["HoldingComment__", "ERPInvoiceNumber__", "ERPPostingError__", "CurrentAttachmentFlag__",
			"Comment__", "LastExportDate__", "LastValidatorName__", "LastValidatorUserId__", "Balance__", "InvoiceStatus__", "ExtractedNetAmount__",
			"AsideReason__", "DuplicateCheckAlertLevel__", "TouchlessPossible__", "DisableMobileActions__", "BudgetExportStatus__", "PortalRuidEx__",
			"PaymentDate__", "PaymentReference__", "PaymentMethod__", "VendorEmail__", "LastPaymentApprovalExportDate__", "CodingTemplate__", "PaymentApprovalMode__",
			"DiscountLimitDate__", "EstimatedDiscountAmount__", "LocalEstimatedDiscountAmount__", "EstimatedLatePaymentFee__", "LocalEstimatedLatePaymentFee__"];

		if (invoiceType === "Non-PO Invoice")
		{
			excludedFields.push("TouchlessEnabled__", "TouchlessDone__");
		}

		return excludedFields;
	}

	function getTableOptions(invoiceType)
	{
		var excludedColumns = ["VendorNumber__", "OpenAmount__", "OpenQuantity__", "ExpectedAmount__", "ExpectedQuantity__", "PartNumber__", "UnitPrice__", "Buyer__", "Receiver__", "DifferentInvoicingParty__", "AcctAssCat__", "Keyword__"];


		var excludedColumnsContainer = null;
		if (invoiceType === "Non-PO Invoice")
		{
			excludedColumns.push("OrderNumber__", "ItemNumber__", "Quantity__");
			excludedColumnsContainer = { fieldConditional: "LineType__", conditionalTable: { GL: { excludedColumns: excludedColumns } } };
		}
		else if (invoiceType === "PO Invoice")
		{
			// Deep copy of base excluded columns
			var GLLinesExcludedColumns = ["VendorNumber__", "OpenAmount__", "OpenQuantity__", "ExpectedAmount__", "ExpectedQuantity__", "PartNumber__", "UnitPrice__", "ItemNumber__", "OrderNumber__", "Quantity__", "AcctAssCat__"];

			// No specific column excluded for PO lines
			excludedColumnsContainer = { fieldConditional: "LineType__", conditionalTable: { PO: { excludedColumns: excludedColumns }, GL: { excludedColumns: GLLinesExcludedColumns } } };
		}

		var tableOptions = [{ name: "ApproversList__", requiredColumns: ["ApproverID__"] },
		{ name: "LineItems__", excludedConditionalColumns: excludedColumnsContainer },
		{ name: "ExtractedLineItems__", excludedFullTable: true }];

		return tableOptions;
	}

	var formDataToXml = {
		excludedFields: [],
		tableOptions: [],
		xmlEncoding: "UTF-8",
		rootElementName: "Invoices",

		Init: function (invoiceType)
		{
			this.excludedFields = getExcludedFields(invoiceType);
			this.tableOptions = getTableOptions(invoiceType);
		},

		AddLinks: function (flexibleFormToXMLConverter, xmlTempFile)
		{
			var xmlDoc = Helpers.XML.CreateXmlDocument();

			// Add link URLs
			var validationURL = flexibleFormToXMLConverter.dataSrc.GetValue("ValidationUrl");
			flexibleFormToXMLConverter.AddNode(xmlDoc, "InvoiceDocumentURL", validationURL);

			var imageURL = validationURL.replace("ManageDocumentsCheck.link", "attach.file");
			imageURL = imageURL.replace("ruid=", "id=");
			flexibleFormToXMLConverter.AddNode(xmlDoc, "InvoiceImageURL", imageURL);

			TemporaryFile.Append(xmlTempFile, xmlDoc.toString());
		},

		// interface: all converters should implement the following methods

		/**
		* Returns the Header of the file (The header will be written first in the file)
		* @returns {string} The header of the file
		**/
		GetHeader: function ()
		{
			var xml = "";
			if (this.xmlEncoding === "UTF-8")
			{
				xml += '<?xml version="1.0" encoding="UTF-8"?>\r\n';
			}
			else if (this.xmlEncoding === "UTF-16")
			{
				xml += '<?xml version="1.0" encoding="UTF-16"?>\r\n';
			}
			else
			{
				xml += '<?xml version="1.0"?>\r\n';
			}
			xml += "<" + this.rootElementName + ">\r\n";
			return xml;
		},

		/**
		* Converts the dataSrc into a string to be written in the result file (after the header, and before the footer)
		* @param {object} dataSrc The Data object of the document to convert
		* @returns {string} A string containing the converted data
		**/
		Convert: function (dataSrc, defaultIndentation)
		{
			if (dataSrc)
			{
				//FT-009975 - Create tempFile to avoid memory consumption issue
				var tempInvoiceXml = TemporaryFile.CreateFile("xml");

				this.Init(dataSrc.GetValue("InvoiceType__"));
				Lib.FlexibleFormToXML.setOptions(this.xmlEncoding, "Invoice", this.excludedFields, this.tableOptions, dataSrc, ["OrderNumber__"]);
				Lib.FlexibleFormToXML.GetXMLFile(tempInvoiceXml, this.AddLinks, defaultIndentation);

				var xml = tempInvoiceXml.GetContent();

				// remove xml header
				xml = xml.substring(xml.indexOf("><") + 1);
				xml = "\t" + xml + "\n";
				return xml;
			}
			return null;
		},

		/**
		* Returns the footer of the file (the footer will be appended at the end of the file)
		* (Optional in the converter)
		* @returns {string} The footer of the file
		**/
		GetFooter: function ()
		{
			return "</" + this.rootElementName + ">\r\n";
		},

		/**
		* Returns the extension of the generated file
		* @returns {string} The extension of the generated file
		**/
		GetExtension: function ()
		{
			return "xml";
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
			return Lib.FormDataConverter.EOL.Unix;
		}
	};

	Lib.FormDataConverter.Register("Generic XML", formDataToXml);
	return formDataToXml;
});