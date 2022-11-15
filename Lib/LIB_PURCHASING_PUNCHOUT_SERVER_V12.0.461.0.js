///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Punchout_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Punchout Library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Locale_Country",
    "Sys/Sys_TechnicalData",
    "[Lib_PO_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Punchout;
        (function (Punchout) {
            var g = Sys.Helpers.Globals;
            /**
             * @exports Punchout
             * @memberof Lib.Purchasing
             */
            function GetShipToAddress(companyCode) {
                var shipTo = {};
                if (!Data.IsNullOrEmpty("TechnicalData__")) {
                    var shipToVars = Sys.TechnicalData.GetValue("ShipToAddress") || Variable.GetValueAsString("ShipToAddress");
                    // Fetch address items from DB, take the rest from the PO
                    shipTo.Company = Data.GetValue("ShipToCompany__");
                    shipTo.Contact = Data.GetValue("ShipToContact__");
                    shipTo.Phone = Data.GetValue("ShipToPhone__");
                    shipTo.Email = Data.GetValue("ShipToEmail__");
                    shipTo.Sub = shipToVars.ToSub;
                    shipTo.Street = shipToVars.ToMail;
                    shipTo.City = shipToVars.ToCity;
                    shipTo.ZipCode = shipToVars.ToPostal;
                    shipTo.Region = shipToVars.ToState;
                    shipTo.Country = shipToVars.ToCountry;
                    return shipTo;
                }
                else {
                    var filter = "(&(ID__=" + Data.GetValue("DeliveryAddressID__") + ")(CompanyCode__=" + companyCode + "))";
                    var attributes = "ID__, ShipToCompany__, ShipToContact__, ShipToEmail__, ShipToPhone__, ShipToSub__, ShipToStreet__, ShipToCity__, ShipToZipCode__, ShipToRegion__, ShipToCountry__";
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("PurchasingShipTo__");
                    query.SetFilter(filter);
                    query.SetAttributesList(attributes);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        if (record) {
                            var shipToVars = record.GetVars();
                            // Fetch address items from DB, take the rest from the PO
                            shipTo.Company = Data.GetValue("ShipToCompany__");
                            shipTo.Contact = Data.GetValue("ShipToContact__");
                            shipTo.Phone = Data.GetValue("ShipToPhone__");
                            shipTo.Email = Data.GetValue("ShipToEmail__");
                            shipTo.Sub = shipToVars.GetValue_String("ShipToSub__", 0);
                            shipTo.Street = shipToVars.GetValue_String("ShipToStreet__", 0);
                            shipTo.City = shipToVars.GetValue_String("ShipToCity__", 0);
                            shipTo.ZipCode = shipToVars.GetValue_String("ShipToZipCode__", 0);
                            shipTo.Region = shipToVars.GetValue_String("ShipToRegion__", 0);
                            shipTo.Country = shipToVars.GetValue_String("ShipToCountry__", 0);
                            return shipTo;
                        }
                        else {
                            Log.Error("ShipTo address not found: ".concat(filter));
                            throw new Error("ShipTo address not found");
                        }
                    }
                    else {
                        Log.Error("Failed to query ShipTo address: ".concat(filter, " (").concat(query.GetLastErrorMessage(), ")"));
                        throw new Error("Failed to query ShipTo address");
                    }
                }
            }
            Punchout.GetShipToAddress = GetShipToAddress;
            function GetBillToAddress(companyCode) {
                var billTo = {};
                var filter = "(CompanyCode__=" + companyCode + ")";
                var attributes = "CompanyName__, Sub__, Street__, City__, PostalCode__, Region__, Country__, PhoneNumber__, ContactEmail__";
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.SetSpecificTable("PurchasingCompanycodes__");
                query.SetFilter(filter);
                query.SetAttributesList(attributes);
                if (query.MoveFirst()) {
                    var record = query.MoveNextRecord();
                    if (record) {
                        var billToVars = record.GetVars();
                        billTo.Company = billToVars.GetValue_String("CompanyName__", 0);
                        billTo.Sub = billToVars.GetValue_String("Sub__", 0);
                        billTo.Street = billToVars.GetValue_String("Street__", 0);
                        billTo.City = billToVars.GetValue_String("City__", 0);
                        billTo.ZipCode = billToVars.GetValue_String("PostalCode__", 0);
                        billTo.Region = billToVars.GetValue_String("Region__", 0);
                        billTo.Country = billToVars.GetValue_String("Country__", 0);
                        billTo.Phone = billToVars.GetValue_String("PhoneNumber__", 0);
                        billTo.Email = billToVars.GetValue_String("ContactEmail__", 0);
                        return billTo;
                    }
                    else {
                        Log.Error("BillTo address not found: ".concat(filter));
                        throw new Error("BillTo address not found");
                    }
                }
                else {
                    Log.Error("Failed to query BillTo address: ".concat(filter, " (").concat(query.GetLastErrorMessage(), ")"));
                    throw new Error("Failed to query BillTo address");
                }
            }
            Punchout.GetBillToAddress = GetBillToAddress;
            function GetBuyerEmail() {
                var buyer = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("BuyerLogin__"));
                return buyer.GetValue("EmailAddress");
            }
            Punchout.GetBuyerEmail = GetBuyerEmail;
            /// Builds an <Address/> tag
            function FormatPunchoutAddress(address, mode) {
                var addressXml = "<Address> \
	<Name xml:lang=\"en\"/> \
	<PostalAddress> \
		<Street/> \
		<City/> \
		<State/> \
		<PostalCode/> \
		<Country/> \
	</PostalAddress> \
</Address>";
                var addressDoc = Process.CreateXMLDOMElement(addressXml);
                var addressNode = addressDoc.selectSingleNode("/Address");
                addressNode.selectSingleNode("Name").text = address.Company;
                var postalAddressNode = addressNode.selectSingleNode("./PostalAddress");
                if (!Sys.Helpers.IsEmpty(address.Contact)) {
                    var node = postalAddressNode.selectSingleNode("./Street");
                    var deliverTo = Process.CreateXMLDOMElement("<DeliverTo/>");
                    deliverTo.text = address.Contact;
                    postalAddressNode.insertBefore(deliverTo, node);
                }
                postalAddressNode.selectSingleNode("./Street").text = address.Street;
                postalAddressNode.selectSingleNode("./City").text = address.City;
                postalAddressNode.selectSingleNode("./State").text = address.Region;
                postalAddressNode.selectSingleNode("./PostalCode").text = address.ZipCode;
                var countryNode = postalAddressNode.selectSingleNode("./Country");
                countryNode.setAttribute("isoCountryCode", address.Country);
                var countryName = Sys.Locale.Country.GetCountryName(address.Country);
                if (countryName) {
                    countryNode.text = countryName; // required by Amazon
                }
                if (address.Sub) {
                    Log.Info("Filling Sub");
                    if (mode === "dell") {
                        var node = postalAddressNode.selectSingleNode("./City");
                        var street2 = Process.CreateXMLDOMElement("<Street/>");
                        street2.text = address.Sub;
                        postalAddressNode.insertBefore(street2, node);
                    }
                    else {
                        var node = postalAddressNode.selectSingleNode("./Street");
                        var deliverTo2 = Process.CreateXMLDOMElement("<DeliverTo/>");
                        deliverTo2.text = address.Sub;
                        postalAddressNode.insertBefore(deliverTo2, node);
                    }
                }
                if (address.Email) // mandatory for dell
                 {
                    Log.Info("Filling Email");
                    var email = Process.CreateXMLDOMElement("<Email></Email>");
                    email.selectSingleNode("//Email").text = address.Email;
                    addressNode.appendChild(email);
                }
                if (address.Phone) // mandatory for dell
                 {
                    Log.Info("Filling Phone");
                    var phone = Process.CreateXMLDOMElement("<Phone><TelephoneNumber><CountryCode /><AreaOrCityCode /><Number></Number></TelephoneNumber></Phone>");
                    phone.selectSingleNode("//Number").text = address.Phone;
                    var countryCodeNode = phone.selectSingleNode("//CountryCode");
                    countryCodeNode.setAttribute("isoCountryCode", address.Country);
                    addressNode.appendChild(phone);
                }
                return addressDoc;
            }
            Punchout.FormatPunchoutAddress = FormatPunchoutAddress;
            /// builds an <ItemOut/> from and <ItemIn/>. Adds quantity, lineNumber and requestedDeliveryDate if given
            function FormatItemOut(itemInXml, quantity, lineNumber, requestedDeliveryDate) {
                // just make a copy of ItemIn to ItemOut
                var itemOutXml = itemInXml.replace(/ItemIn/gm, "ItemOut");
                var itemOutNode = Process.CreateXMLDOMElement(itemOutXml);
                // remove LeadTime if present
                var leadTimeNode = itemOutNode.selectSingleNode("/ItemOut/ItemDetail/LeadTime");
                if (leadTimeNode) {
                    leadTimeNode.parentNode.removeChild(leadTimeNode);
                }
                // add quantity and lineNumber
                itemOutNode.setAttribute("quantity", quantity);
                itemOutNode.setAttribute("lineNumber", lineNumber);
                if (requestedDeliveryDate) {
                    itemOutNode.setAttribute("requestedDeliveryDate", requestedDeliveryDate.toISOString().substring(0, 10) /* date only */);
                }
                return itemOutNode;
            }
            Punchout.FormatItemOut = FormatItemOut;
            function FormatPunchoutXml(punchoutSiteVars, shipTo, billTo, buyerEmail, timestamp) {
                //#region formatPunchoutXml
                Log.Info("Buyer is " + Data.GetValue("BuyerLogin__"));
                var secret = punchoutSiteVars.GetValue("Secret__", 0);
                var testMode = punchoutSiteVars.GetValue("TestMode__", 0) == "1";
                var vendorIdentity = punchoutSiteVars.GetValue("Identity__", 0);
                var vendorDomain = punchoutSiteVars.GetValue("Domain__", 0) || "NetworkId";
                var senderIdentity = punchoutSiteVars.GetValue("SenderIdentity__", 0);
                var senderDomain = punchoutSiteVars.GetValue("SenderDomain__", 0) || "NetworkId";
                var mode = punchoutSiteVars.GetValue("PunchoutOrderURL__", 0).match(/^https:\/\/.*\.dell\./) ? "dell" : "standard"; // example https://b2bpreview.dell.com:443/invoke/B2BDirect.Entry/...
                Log.Info("Punchout send mode:" + mode);
                var xmlHeader = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\
<!DOCTYPE cXML SYSTEM \"http://xml.cxml.org/schemas/cXML/1.2.048/cXML.dtd\">\n";
                var template = "<cXML version=\"1.2.014\" xml:lang=\"en-US\"> \
<Header> \
		<From> \
			<Credential> \
				<Identity/> \
			</Credential> \
		</From> \
		<To> \
			<Credential> \
				<Identity/> \
			</Credential> \
		</To> \
		<Sender> \
			<Credential> \
				<Identity/> \
				<SharedSecret/> \
			</Credential> \
			<UserAgent>www.esker.com</UserAgent> \
		</Sender> \
</Header> \
<Request deploymentMode=\"test\"> \
		<OrderRequest> \
			<OrderRequestHeader orderVersion=\"1\" type=\"new\"> \
				<Total> \
					<Money/> \
				</Total> \
				<ShipTo> \
				</ShipTo> \
				<BillTo> \
				</BillTo> \
				<Shipping> \
					<Money/> \
					<Description xml:lang=\"en\" /> \
				</Shipping> \
				<Contact> \
					<Name xml:lang=\"en\" /> \
				</Contact> \
				<Comments/> \
				<Extrinsic/> \
			</OrderRequestHeader> \
		</OrderRequest> \
</Request> \
</cXML>";
                var cxmlDoc = Process.CreateXMLDOMElement(template);
                // CXML header
                var currentNode = cxmlDoc.selectSingleNode("//cXML");
                currentNode.setAttribute("payloadID", timestamp.valueOf());
                currentNode.setAttribute("timestamp", timestamp.valueOf());
                // Credentials Header
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/From/Credential");
                currentNode.setAttribute("domain", senderDomain);
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/From/Credential/Identity");
                currentNode.text = senderIdentity;
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/To/Credential");
                currentNode.setAttribute("domain", vendorDomain);
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/To/Credential/Identity");
                currentNode.text = vendorIdentity;
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/Sender/Credential");
                currentNode.setAttribute("domain", senderDomain);
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/Sender/Credential/Identity");
                currentNode.text = senderIdentity;
                currentNode = cxmlDoc.selectSingleNode("//cXML/Header/Sender/Credential/SharedSecret");
                currentNode.text = "XXX"; // Will be really set later, after message logging
                // Request
                currentNode = cxmlDoc.selectSingleNode("//cXML/Request");
                currentNode.setAttribute("deploymentMode", testMode ? "test" : "production");
                currentNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader");
                currentNode.setAttribute("orderDate", timestamp.toISOString());
                currentNode.setAttribute("orderID", Data.GetValue("OrderNumber__"));
                currentNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/Total/Money");
                currentNode.setAttribute("currency", Data.GetValue("Currency__"));
                currentNode.text = Data.GetValue("TotalNetAmount__");
                // Fill currency attribute of Money (Shipping) although it is empty in order to be valid against DTD
                currentNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/Shipping/Money");
                currentNode.setAttribute("currency", Data.GetValue("Currency__"));
                // ShipTo
                Log.Info("Filling ShipTo");
                var shipToNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/ShipTo");
                var shipToAddressNode = FormatPunchoutAddress(shipTo, mode);
                shipToNode.appendChild(shipToAddressNode);
                // BillTo
                Log.Info("Filling BillTo");
                if (mode === "dell" && Sys.Helpers.IsEmpty(billTo.Contact)) { // Mandatory for dell
                    billTo.Contact = Language.Translate("_Billing Department");
                }
                var billToNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/BillTo");
                var billToAddressNode = FormatPunchoutAddress(billTo, mode);
                billToNode.appendChild(billToAddressNode);
                // Contact
                cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/Contact/Name").text = shipTo.Contact;
                // Extrinsic (required for Amazon)
                currentNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader/Extrinsic");
                currentNode.setAttribute("name", "UserEmail");
                currentNode.text = buyerEmail;
                // add ItemOut
                var parent = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest");
                var lineItems = Data.GetTable("LineItems__");
                for (var i = 0; i < lineItems.GetItemCount(); i++) {
                    var row = lineItems.GetItem(i);
                    var itemInXml = row.GetValue("ItemInCxml__");
                    // create ItemOut by copying stuff from ItemIn
                    var itemOutNode = FormatItemOut(itemInXml, row.GetValue("ItemQuantity__"), i + 1, row.GetValue("ItemRequestedDeliveryDate__"));
                    parent.appendChild(itemOutNode);
                }
                Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnPunchoutOrder", cxmlDoc);
                // Save sent messages
                if (Sys.Parameters.GetInstance("PAC").GetParameter("SavePunchoutOrderXmlOnDocument")) {
                    var tempFile = g.TemporaryFile.CreateFile("xml", "utf8");
                    g.TemporaryFile.Append(tempFile, xmlHeader + cxmlDoc.xml);
                    Attach.AttachTemporaryFile(tempFile, { name: "cXML order", isTechnical: true });
                }
                // Set credentials sensitive information *after* logging
                cxmlDoc.selectSingleNode("//cXML/Header/Sender/Credential/SharedSecret").text = secret;
                var xmlText = xmlHeader + cxmlDoc.selectSingleNode("//cXML").xml;
                return xmlText;
                //#endregion
            }
            Punchout.FormatPunchoutXml = FormatPunchoutXml;
            function GetPunchoutSite(vendorID) {
                var filter = "(&(SupplierID__=" + vendorID + ")(CompanyCode__=" + Data.GetValue("CompanyCode__") + "))";
                var attributes = "PunchoutOrderURL__,Domain__,Identity__,Secret__,SenderDomain__,SenderIdentity__,TestMode__,ConfigurationName__";
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.SetSpecificTable("P2P - PunchoutSites__");
                query.SetFilter(filter);
                query.SetAttributesList(attributes);
                if (query.MoveFirst()) {
                    var record = query.MoveNextRecord();
                    if (record) {
                        return record.GetVars();
                    }
                }
                Log.Error("Cannot find punchout site: " + query.GetLastErrorMessage());
                return null;
            }
            Punchout.GetPunchoutSite = GetPunchoutSite;
            function Order(vendorID) {
                var ret = false;
                var status = "400";
                var message;
                var companyCode = Data.GetValue("CompanyCode__");
                // Punchout site lookup
                var punchoutSiteVars = Lib.Purchasing.Punchout.GetPunchoutSite(vendorID);
                if (!punchoutSiteVars) {
                    status = "Bad punchout site config";
                    return { ret: false, message: "Punchout site not found", status: status, punchoutSiteConfigNameUsed: null };
                }
                // ShipTo, BillTo and Buyer lookup
                var buyerEmail = Lib.Purchasing.Punchout.GetBuyerEmail();
                var shipTo = Lib.Purchasing.Punchout.GetShipToAddress(companyCode);
                var billTo = Lib.Purchasing.Punchout.GetBillToAddress(companyCode);
                // Build message
                var orderXml;
                try {
                    orderXml = Lib.Purchasing.Punchout.FormatPunchoutXml(punchoutSiteVars, shipTo, billTo, buyerEmail, new Date());
                }
                catch (error) {
                    message = error.message;
                    status = "Bad punchout site config";
                    Log.Error(message);
                    return { ret: false, message: message, status: status, punchoutSiteConfigNameUsed: punchoutSiteVars === null || punchoutSiteVars === void 0 ? void 0 : punchoutSiteVars.GetValue("ConfigurationName__", 0) };
                }
                // Send it to vendor punchout server
                if (Sys.Parameters.GetInstance("PAC").GetParameter("DebugDontSendElectronicOrder") == "true") {
                    throw "Testing. Not sending anything";
                }
                var url = punchoutSiteVars.GetValue("PunchoutOrderURL__", 0);
                var isSimulateURL = !(url.indexOf("##SIMULATE##") === -1);
                var result;
                if (!isSimulateURL) {
                    Log.Info("Sending punchout order at URL " + url);
                    var punchoutHttp = Process.CreateHttpRequest();
                    result = punchoutHttp.Call({
                        "url": url,
                        "data": orderXml,
                        "method": "POST",
                        "headers": {
                            "Content-Type": "text/xml"
                        },
                        "noClientCertificate": true
                    });
                }
                // Handle result
                if (isSimulateURL) {
                    Log.Warn("is a simulate order URL => force success, and dont send anything");
                    ret = true;
                    message = "Forced ok";
                    status = "200";
                }
                else if (result.status != 200) {
                    Log.Error("Punchout order failed");
                    Log.Error("Status : " + result.status);
                    // Log.Error("Error : " + result.lastErrorMessage.replace(/\r/g, "")); // Presence of CRLF makes some log parsers behave strangely
                    // Log.Error("Data : " + result.data);
                    message = result.lastErrorMessage;
                    status = result.status.toString();
                }
                else {
                    try {
                        var docStartIndex = result.data.indexOf("<cXML");
                        var docStopIndex = result.data.indexOf("/cXML>");
                        var cxmlDoc = result.data.substring(docStartIndex, docStopIndex + 6);
                        var xmlResponse = Process.CreateXMLDOMElement(cxmlDoc);
                        var xPath = "/cXML/Response/Status/@code";
                        var responseStatus = xmlResponse.selectSingleNode(xPath).nodeValue;
                        if (responseStatus == "200") {
                            Log.Info("Punchout order ok, response: " + result.data);
                            ret = true;
                        }
                        else {
                            xPath = "/cXML/Response/Status/@text";
                            message = xmlResponse.selectSingleNode(xPath).nodeValue;
                            status = responseStatus;
                            Log.Error("Punchout order failed, error " + responseStatus + ": " + message);
                        }
                    }
                    catch (e) {
                        ret = false;
                        Log.Error("Failure when parsing cXML: " + e.message);
                        if (Sys.Parameters.GetInstance("PAC").GetParameter("SavePunchoutOrderXmlOnDocument")) {
                            var tempFile = g.TemporaryFile.CreateFile("xml", "utf8");
                            g.TemporaryFile.Append(tempFile, result.data);
                            Attach.AttachTemporaryFile(tempFile, { name: "cXML response", isTechnical: true });
                        }
                    }
                }
                return { ret: ret, message: message, status: status, punchoutSiteConfigNameUsed: punchoutSiteVars === null || punchoutSiteVars === void 0 ? void 0 : punchoutSiteVars.GetValue("ConfigurationName__", 0) };
            }
            Punchout.Order = Order;
        })(Punchout = Purchasing.Punchout || (Purchasing.Punchout = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
