/**
 * @file Lib.PO.Customization.Server library: server script Purchase Order customization callbacks
 */

/**
 * Package Purchase Order Server script customization callbacks
 * @namespace Lib.PO.Customization.Server
 */

/* LIB_DEFINITION
{
	"name": "Lib_PO_Customization_Server",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "Custom library extending Purchase Order scripts on server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Server", function ()
{
	/**
	 * @lends Lib.PO.Customization.Server
	 */
	var customization = {
		/**
		 * This function will be called at the purchase order loading; at the end of the extraction script.
		 * @example
		 * <pre><code>
		 * OnLoad: function ()
		 * {
		 * 	// Initialize the payment method to "T"
		 * 	Data.SetValue("PaymentMethodCode__", "T");
		 * }
		 * </code></pre>
		 */
		OnLoad: function ()
		{
		},
		/**
		 * @typedef {Object} IsAutoSendOrderEnabledReturn Use the following object if you want to customize some fields before sending automatically the PO :
		 * Note
		 *		When a parameter is not set in the JavaScript object, the default field value from the purchase order form is used.
		 * @property {string} EmailNotificationOptions: Indicates whether a notification is sent and who is the recipient. Possible values are:
		 *		SendToVendor: When the purchase order is created, an email notification is sent to the vendor. The notification contains a link to view the order on the vendor portal, a summary of the order details and the message specified in the BuyerComment parameter.
		 *		DontSend: When the purchase order is created, no email notification is sent.
		 *		Note
		 *		Regardless of the chosen option, an email notification is always sent to the requester. The notification indicates that the purchase requisition has been sent to the vendor.[Optional]
		 * @property {string} VendorEmail: Use only when EmailNotificationOptions is set to SendToVendor.
		 *		Email address of the vendor to which the purchase order is sent.
		 * @property {string} VendorLogin: Use only when EmailNotificationOptions is set to SendToVendor.
		 *		Identifier of the vendor contact. This identifier is used by the vendor contact to connect to the portal.
		 * @property {string} BuyerComment: Use only when EmailNotificationOptions is set to SendToVendor.
		 *		Additional message inserted in the body of the notification sent to the vendor.
		 * @property {number} PaymentAmount: Use only when PaymentPercent is not already set.
		 *		Amount to be paid as advance payment.
		 * @property {number} PaymentPercent: Use only when PaymentAmount is not already set.
		 *		Percentage of the total net amount to be paid as advance payment.
		 * @memberof Lib.PO.Customization.Server
		 */
		/**
		 * @description Allows you to automate the purchase order sending under the conditions of your choice. This user exit is called in the extraction script of the Purchase Order process.
		 * @version 5.110 and higher
		 * @memberof Lib.PO.Customization.Server
		 * @function IsAutoSendOrderEnabled
		 * @return {boolean} boolean specifies whether the purchase order must be automatically sent or not. Possible values are:
		 * true: When the purchase order is created, the purchase order is automatically sent with the default field values.
		 * false (default): When the purchase order is created, the buyer needs to manually send the purchase order.
		 * OR
		 * @return {Lib.PO.Customization.Server.IsAutoSendOrderEnabledReturn} json When the purchase order is created, the purchase order is automatically sent. The field values are specified in this JavaScript object with the following structure:
		 * @example
		 * This user exit enables the automatic purchase order sending when all the following conditions are fulfilled:
		 * The vendor number is 01254796.
		 * The total net amount of the purchase order does not exceed 100.
		 * When the purchase order is created, an email notification is sent to vendor@example.com with the following message: Please call us before the shipment. An advance payment of 30% is requested from the treasurer.

			IsAutoSendOrderEnabled: function ()
			{
				if ((Data.GetValue("VendorNumber__") === "01254796") && (Data.GetValue("TotalNetAmount__") < 100))
				{
					var parametersObject = {
						EmailNotificationOptions: "SendToVendor",
						VendorEmail: "vendor@example.com",
						VendorLogin: "login@example.com",
						BuyerComment: "Please call us before the shipment.",
						PaymentPercent: 30
					};
					return parametersObject;
				}
				else
				{
					return false;
				}
			}
		 */
		IsAutoSendOrderEnabled: function ()
		{
			/*
			var res = {};
			res.EmailNotificationOptions = "SendToVendor";
			res.PaymentPercent = 50;
			return res;
			*/
			return false;
		},

		/**
		 * @typedef {Object} IsAutoReceiveOrderEnabledReturn Fields which are possible to include are the following :
		 * @property {date}	DeliveryDate: Date on which ordered items are received. When unspecified, this parameter is set with the date on which the purchase order is sent. [Optional]
		 * @property {string} DeliveryNote: Identifier of the document that comes along with the delivery. [Optional]
		 * @property {string} Comment: Comment displayed on the goods receipt. [Optional]
		 * @memberof Lib.PO.Customization.Server
		 */
		/**
		 * @description Allows you to automate the goods receipt creation under the conditions of your choice. This user exit is called in the validation script of the Purchase Order process.
		 * @version 5.110 and higher
		 * @memberof Lib.PO.Customization.Server
		 * @function IsAutoReceiveOrderEnabled
		 * @return {boolean} boolean specifies whether the goods receipt must be automatically created or not. 
		 * 		Set to 'true', the good receipt form will be created automatically which will directly mark the PO as 'Received'.
		 * OR
		 * @return {Lib.PO.Customization.Server.IsAutoReceiveOrderEnabledReturn} json  NOTE : If the object is empty, then auto receive order will be enable as it was set to 'true'.
		 * @example
		 * 		This user exit enables the automatic goods receipt creation when all the following conditions are fulfilled:
		 * 				- The vendor number is 01254796.
		 * 				- The total net amount of the purchase order does not exceed 100.
		 * 		When the purchase order is sent, the goods receipt is automatically created with the following comment: "Goods receipt automatically created to complete the order". 
		 * 		The ordered quantities are used to set the received quantities, and the Order status changes to Received.
		 * 
		  IsAutoReceiveOrderEnabled: function ()
		  {
			   if ((Data.GetValue("VendorNumber__") === "01254796") && (Data.GetValue("TotalNetAmount__") < 100))
			   {
					 var parametersObject = {
						 Comment: "Goods receipt automatically created to complete the order."
					 }
					 return parametersObject;
			   }
			   else
			   {
					 return false;
			   }
		  }
		 */
		IsAutoReceiveOrderEnabled: function ()
		{
			/*
			var res = {};
			res.DeliveryDate = new Date();
			res.Comment = "Automatic delivery";
			return res;
			*/
			return false;
		},

		/**
		 * @description Allows you to modify the purchase order PDF file and the CSV file before they are sent to the vendor. The CSV file contains all the purchase order data.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnAttachPO
		 * @version 5.134 and higher 
		 * @param {integer} iAttachPO Integer value that specifies the zero-based index of the attachment corresponding to the generated purchase order in PDF format.
		 * @param {integer} iAttachCSV Integer value that specifies the zero-based index of the attachment corresponding to the CSV file that contains all the purchase order data.
		 * @example This user exit adds the terms and conditions at the end of the purchase order PDF file that is sent to the vendor. The po_terms_condition.pdf file which contains the terms and conditions is a resource file.

		OnAttachPO: function (iAttachPO, iAttachCSV)
		{
			var tcFile = "%Misc%\\po_terms_condition.pdf";
			var pdfCommands = "-merge %infile[" + (iAttachPO + 1) + "]% \"" + tcFile + "\"";
			Attach.PDFCommands(pdfCommands);
		}
		 */
		OnAttachPO: function (iAttachPO, iAttachCSV)
		{
		},

		/**
		 * @description Allows you to customize how the action is processed when the validation script executes an unknown action.
		 * 		This user exit is called when the validation script of the Purchase Order process is triggered by an unknown action.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnUnknownAction
		 * @version 5.148 and higher
		 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
		 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
		 * @return {boolean} Boolean value indicating whether the action has been handled. Possible values are:
		 * 		true: The action has been handled.
		 * 		false: The action has not been handled.
		 * @example This user exit logs the unknown actions details.

OnUnknownAction: function (currentAction, currentName)
{
	Log.Error(currentAction + "-" + currentName);
}
		 */
		OnUnknownAction: function (currentAction, currentName)
		{
			return false;
		},

		/**
		 * @typedef {Object} OnEditOrderResult
		 * @property {string} conversationMessage value containing the message to display in the Conversation pane. Return null to keep the original message.
		 * @memberof Lib.PO.Customization.Server
		 */
		/**
		 * @description Allows you to customize the purchase order when it has been edited. This user exit is called in the validation script of the Purchase Order process, when saving an edited purchase order.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnEditOrder
		 * @version 5.149 and higher
		 * @param {object} options JavaScript object specifying the edited purchase order options
		 * @param {string[]} options.changedFields array containing the names of the fields that have been modified.
		 * @return {Lib.PO.Customization.Server.OnEditOrderResult} returns a result object
		 * @example In the following example, a friendly message containing the names of the modified fields is displayed.

		OnEditOrder: function (options)
		{
			return {
				conversationMessage: "Some fields have been modified: \n\t- " + options.changedFields.join("\n\t- ")
			};
		}
		 */
		OnEditOrder: function (options)
		{
			return null;
		},

		/**
		 * @description Allows you to retrieve the next document number based on a customized numbering sequence. 
		 * This user exit is called in the validation script of the Purchase Requisition, Purchase Order or Goods Receipt process, depending on the library in which it is located.
		 * @memberof Lib.PO.Customization.Server
		 * @function GetNumber
		 * @version 5.149 and higher
		 * @param {string} defaultSequenceName value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
		 * @return {string} value containing the next number from your customized sequence.
		 * @example

		  var number = "";
		  var companyCode = Data.GetValue("CompanyCode__");
		  var ReqNumberSequence = Process.GetSequence(defaultSequenceName+companyCode);
		  number = ReqNumberSequence.GetNextValue();
		  if (number === "")
		  {
					  Log.Info("Error while retrieving a number");
		  }
		  else
		  {
					  number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
					  Log.Info("Number: " + number);
		  }
		  return number;
		 */

		/*
		GetNumber: function (defaultSequenceName)
		{
			// Must return something
		},
		*/

		/**
		* If defined this function is called when the purchase order need a number
		* @return {string} returns Purchase Order attachment name without extension
		*/
		GetName: function ()
		{
			/*
			return "PO";
		*/
		},

		/**
		 * @description Allows you to customize the BAPI call used to update header level fields of the purchase order in SAP. This user exit is called in the validation script of the Purchase Order process, when saving an edited purchase order.
		 * 		This user exit is called once for the header level fields, if at least one field has been modified.
		 * 		By default when editing a purchase order, all header fields are read-only so this user exit is never called. This user exit is only useful if you have previously implemented the CustomizeLayout user exit to make one of the header fields editable.
		 * 		To customize the item level fields that are being updated, implement the [OnChangeLine]{@link Lib.PO.Customization.Server.OnChangeLine} user exit.
		 * @memberof Lib.PO.Customization.Server
		 * @function ChangePOInSAP
		 * @version 5.149 and higher
		 * @param {object} managerJavaScript object defining the SAP connection manager.
		 * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
		 * @param {SapBAPI} BAPI_PO_CHANGE SapBAPI object representing the BAPI to call.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} changes JavaScript object specifying the list of modified fields.
		 *		For example,

				{
					PaymentTermCode__:
					{
						from: "T30",
						to: "T45"
					},
					PaymentMethodCode__:
					{
						from: "",
						to: "T"
					}
				}
		 * @return {boolean} Boolean value indicating whether the function updated the purchase order in SAP. The possible values are:
		 * 		true: The function updated all the modified fields in SAP.
		 * 		false: The function did not update the fields in SAP.
		 */
		ChangePOInSAP: function (manager, BAPI_PO_CHANGE, changes, item)
		{
			/*
			// headerChanges: { fieldName: { from: oldValue, to: newValue }, ... }
				return false;
				*/
		},
		/**
		 * @description Allows you to customize each of the line items in the purchase order when they are updated in SAP. This user exit is called in the validation script of the Purchase Order process, when saving a modified purchase order.
		 * 		By default, the Purchase Order process updates the Req delivery date field in SAP. If this user exit is implemented, the update of all the editable fields should be defined in the user exit, including for the Req delivery date field.
		 * 		To customize the header level fields in the purchase order when they are updated in SAP, implement the [ChangePOInSAP]{@link Lib.PO.Customization.Server.ChangePOInSAP} user exit.
		 * 		To customize the line items in the purchase order when they are added in SAP, implement the [OnAddLine]{@link Lib.PO.Customization.Server.OnAddLine} user exit.
		 * @version 5.161 and higher
		 * @memberof Lib.PO.Customization.Server
		 * @function OnChangeLine
		 * @param {object} manager JavaScript object defining the SAP connection manager.
		 * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
		 * @param {object} BAPI_PO_CHANGE SapBAPI object representing the BAPI to call.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} changes JavaScript object specifying the list of modified fields of the line item that is currently being updated in SAP.
		 * For example,

			{
				ItemRequestedDeliveryDate__:
				{
					from: "2018-08-28",
					to: "2018-08-30"
				},
				ItemComment__:
				{
					from: "",
					to: "Urgent"
				}
			}
		 * @param {object} item Item object representing the item to update.
		 * @return {boolean} Boolean value indicating whether the function updated the purchase order in SAP. The possible values are:
		 * 		true: The function updated all the modified fields in SAP, including Req delivery date.
		 * 		false: The function did not update the fields in SAP. The application updates the Req delivery date fields.
		 * @example In the following example, the Description fields of the Items table, as well as the Req delivery date fields, are updated in SAP.

		OnChangeLine: function (manager, BAPI_PO_CHANGE, changes, item)
		{
			if (item)
			{
				var PO_ITEM = manager.GetValue("PO_ITEM", item);
				Sys.Helpers.Object.ForEach(changes, function (from_to, fieldName)
				{
					var value = item.GetValue(fieldName);
					if (fieldName == "ItemRequestedDeliveryDate__")
					{
						var POSCHEDULE = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULE");
						var POSCHEDULEX = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULEX");
						var sched = POSCHEDULE.AddNew();
						var schedx = POSCHEDULEX.AddNew();
						sched.SetValue("PO_ITEM", PO_ITEM);
						schedx.SetValue("PO_ITEM", PO_ITEM);
						schedx.SetValue("PO_ITEMX", "X");
						sched.SetValue("DELIVERY_DATE", manager.FormatDate(value));
						schedx.SetValue("DELIVERY_DATE", "X");
					}
					else if (fieldName == "ItemDescription__")
					{
						var POITEM = BAPI_PO_CHANGE.TablesPool.Get("POITEM");
						var POITEMX = BAPI_PO_CHANGE.TablesPool.Get("POITEMX");
						var poItem = POITEM.AddNew();
						var poItemx = POITEMX.AddNew();
						poItem.SetValue("PO_ITEM", PO_ITEM);
						poItemx.SetValue("PO_ITEM", PO_ITEM);
						poItemx.SetValue("PO_ITEMX", "X");
						poItem.SetValue("SHORT_TEXT", value);
						poItemx.SetValue("SHORT_TEXT", "X");
					}
					else
					{
						Log.Info("Change " + fieldName + " in SAP not supported");
					}
				});
				return true;
			}
			return false;
		}
		 */
		OnChangeLine: function (manager, BAPI_PO_CHANGE, changes, item)
		{

		},

		/**
		 * @description Allows you to customize each of the line items in the purchase order when they are added to SAP. This user exit is called in the validation script of the Purchase Order process.
		 *		To customize the line items in the purchase order when they are updated in SAP, implement the [OnChangeLine]{@link Lib.PO.Customization.Server.OnChangeLine} user exit.
		 * @version 5.161 and higher
		 * @memberof Lib.PO.Customization.Server
		 * @function OnAddLine
		 * @param {object} manager JavaScript object defining the SAP connection manager.
		 *		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
		 * @param {SapBAPI} BAPI_PO_CREATE1 SapBAPI object representing the BAPI to call.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {Item} item Item object representing the item to add.
		 * @param {object} poItem JavaScript object representing the line item that is currently being added to the SAP POITEM table.
		 *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} poItemx JavaScript object representing the line item that is currently being added to the SAP POITEMX table.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} poAccount JavaScript object representing the line item that is currently being added to the SAP POACCOUNT table.
		 *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} poAccountx JavaScript object representing the line item that is currently being added to the SAP POACCOUNTX table.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} sched JavaScript object representing the line item that is currently being added to the SAP POSCHEDULE table.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} schedx JavaScript object representing the line item that is currently being added to the SAP POSCHEDULEX table.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} poLine JavaScript object representing the line item that is currently being added to POData object, used to fill in the fields of the Crystal Reports template.
		 *		Refer to CustomizePOData for more information.
		 * @return {boolean} value indicating whether the function added the purchase order item in SAP. The possible values are:
		 *		true: The function added all the line item in SAP.
		 *		false: The function did not add the line item in SAP.
		 * @example
		 * The following example illustrates how to use additional account assignments, such as internal order and fixed asset number, on each of the line items in the purchase order when they are added to SAP.

		OnAddLine: function (manager, BAPI_PO_CREATE1, item, poItem, poItemx, poAccount, poAccountx, sched, schedx, poline)
		{
			var PO_ITEM = manager.GetValue("PO_ITEM", item);
			var ASSET_NO = manager.GetValue("ASSET_NO", item);
			var COST_CTR = manager.GetValue("COST_CTR", item);
			var G_L_ACCT = manager.GetValue("G_L_ACCT", item);
			var ORDER_NO = manager.GetValue("ORDER_NO", item);

			if (!poAccount)
			{
				poAccount = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNT").AddNew();
				poAccountx = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNTX").AddNew();
				poAccount.SetValue("PO_ITEM", PO_ITEM);
				poAccountx.SetValue("PO_ITEM", PO_ITEM);
				poAccountx.SetValue("PO_ITEMX", "X");
			}

			if (ASSET_NO)
			{
				poItem.SetValue("ACCTASSCAT", "A");
				poItemx.SetValue("ACCTASSCAT", "X");
				poAccount.SetValue("ASSET_NO", Sys.Helpers.String.SAP.NormalizeID(ASSET_NO, 12));
				poAccountx.SetValue("ASSET_NO", "X");

				// Resets all other dimensions.
				poAccount.SetValue("COSTCENTER", "");
				poAccountx.SetValue("COSTCENTER", "");
				poAccount.SetValue("GL_ACCOUNT", "");
				poAccountx.SetValue("GL_ACCOUNT", "");
				poAccount.SetValue("ORDERID", "");
				poAccountx.SetValue("ORDERID", "");
			}
			else
			{
				poItem.SetValue("ACCTASSCAT", "K");
				poItemx.SetValue("ACCTASSCAT", "X");

				if (COST_CTR)
				{
					poAccount.SetValue("COSTCENTER", Sys.Helpers.String.SAP.NormalizeID(COST_CTR, 10));
					poAccountx.SetValue("COSTCENTER", "X");
				}
				else
				{
					poAccount.SetValue("COSTCENTER", "");
					poAccountx.SetValue("COSTCENTER", "");
				}

				if (G_L_ACCT)
				{
					poAccount.SetValue("GL_ACCOUNT", Sys.Helpers.String.SAP.NormalizeID(G_L_ACCT, 10));
					poAccountx.SetValue("GL_ACCOUNT", "X");
				}
				else
				{
					poAccount.SetValue("GL_ACCOUNT", "");
					poAccountx.SetValue("GL_ACCOUNT", "");
				}

				if (ORDER_NO)
				{
					poAccount.SetValue("ORDERID", Sys.Helpers.String.SAP.NormalizeID(ORDER_NO, 12));
					poAccountx.SetValue("ORDERID", "X");
				}
				else
				{
					poAccount.SetValue("ORDERID", "");
					poAccountx.SetValue("ORDERID", "");
				}
			}

			// Handling additional dimensions: Internal order and Asset number.
			poline[this.manager.definition.ERPToManagerNames.ORDER_NO] = ORDER_NO;
			poline[this.manager.definition.ERPToManagerNames.ASSET_NO] = ASSET_NO;
		}
		 */
		OnAddLine: function (manager, poItem, poItemx, poAccount, poAccountx, sched, schedx)
		{
		},

		/**
		 * @description Allows you to perform operations after the Purchase Order process validation. This user exit is called at the end of the validation script of the Purchase Order process.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnValidationScriptEnd
		 * @version 5.158 and higher
		 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
		 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
		 * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
		 * 		Possible values are:
		 * 			true: The user exit is expected to be called again in the current workflow step.
		 * 			false: The user exit is not expected to be called again in the current workflow step.
		 * @example In the following example, an email is sent to the requester at each step of the workflow.

OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
{
	if (currentAction == "approve_asynchronous" && currentName == "PostValidation_Submit")
	{
		var user = Users.GetUser(Data.GetValue("RequisitionInitiator__"));
		var validator = Lib.P2P.GetValidator();
		var email = Sys.EmailNotification.CreateEmailWithUser(
		{
			user: user,
			subject: "Validation by " + validator.GetValue("FirstName") + " " + validator.GetValue("LastName"),
			template: "Purchasing_Email_NotifBuyer_PODoNotSend.htm",
			customTags: "Requester",
			escapeCustomTags: true,
			backupUserAsCC: true,
			sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
		});
		if (email)
		{
			Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", "Approbation step");
			Sys.EmailNotification.SendEmail(email);
		}
	}
}
		 */
		OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
		{

		},

		/**
		 * @description Allows you to customize a BAPI before it is actually called to create or modify the purchase order or the goods receipt in SAP. This user exit is called in the validation script of the Purchase Order or Goods Receipt process, depending on the library in which it is located.
		 * 		To customize the results returned by the BAPI call, implement the OnAfterCallBapi user exit.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnBeforeCallBapi
		 * @version 5.161 and higher
		 * @param {object} manager JavaScript object defining the SAP connection manager.
		 * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
		 * @param {string} actionString value indicating the action for which the BAPI is called. Possible values are:
		 * 		CREATE: The BAPI is called to create the purchase order or the goods receipt in SAP.
		 * 		CHANGE: The BAPI is called to update an existing purchase order in SAP.
		 * @param {object} BAPI_OBJECT SapBAPI object representing the BAPI to call.
		 * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @example SAP purchase order
		 *		In the following example, the user exit is implemented in the Lib_PO_Customization_Server library.
		 *		When creating the purchase order, this example fills the CREATED_BY field in SAP with the buyer's ERP identifier.

		OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
		{
			if (action === "CREATE")
			{
				var buyerLogin = Data.GetValue("BuyerLogin__");
				var buyer = Users.GetUserAsProcessAdmin(buyerLogin);
				if (buyer)
				{
					var buyerERPID = buyer.GetValue("ERPUSER");
					var POHEADER = BAPI_OBJECT.ExportsPool.Get("POHEADER");
					if (buyerERPID && POHEADER)
					{
						// https://www.sapdatasheet.org/abap/tabl/bapimepoheader.html
						Log.Info("Create PO in SAP with User SAP ID '" + buyerERPID + "'");
						POHEADER.SetValue("CREATED_BY", buyerERPID);
					}
				}
			}
		}

		 * @example SAP goods receipt
		 * In the following example, the user exit is implemented in the Lib_GR_Customization_Server library.
		 * When creating the goods receipt, this example fills the PR_UNAME field in SAP with the recipient's ERP identifier.

		OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
		{
			if (action === "CREATE")
			{
				var recipientLogin = Data.GetValue("ValidationOwnerID") || Data.GetValue("OwnerId");
				var recipient = Users.GetUserAsProcessAdmin(recipientLogin);
				if (recipient)
				{
					var recipientERPID = recipient.GetValue("ERPUSER");
					var GOODSMVT_HEADER = BAPI_OBJECT.ExportsPool.Get("GOODSMVT_HEADER");
					if (recipientERPID && GOODSMVT_HEADER)
					{
						// https://www.sapdatasheet.org/abap/tabl/bapi2017_gm_head_01.html
						Log.Info("Create GR in SAP with User SAP ID '" + recipientERPID + "'");
						GOODSMVT_HEADER.SetValue("PR_UNAME", recipientERPID);
					}
				}
			}
		}
		 */
		OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
		{

		},
		/**
		 * @description Allows you to make use of the results returned by a BAPI call when creating or modifying the purchase order or the goods receipt in SAP. Typically, you can implement specific actions in response to specific error cases. This user exit is called in the validation script of the Purchase Order or Goods Receipt process, depending on the library in which it is located.
		 * 		To customize the BAPI before it is actually called, implement the OnBeforeCallBapi user exit.
		 * @memberof Lib.PO.Customization.Server
		 * @function OnAfterCallBapi
		 * @version 5.161 and higher
		 * @param {object} manager JavaScript object defining the SAP connection manager.
		 *		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
		 * @param {string} action String value indicating the action for which the BAPI is called. Possible values are:
		 * 		CREATE: The BAPI is called to create the purchase order or the goods receipt in SAP.
		 * 		CHANGE: The BAPI is called to update an existing purchase order in SAP.
		 * @param {object} BAPI_OBJECT SapBAPI object representing the BAPI to call.
		 *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
		 * @param {object} result JSON string value. The result of the BAPI call.
		 */
		OnAfterCallBapi: function (manager, action, BAPI_OBJECT, result)
		{

		},

		/**
		 * @description Implement this function to customize the cXML OrderRequest sent to vendor
		 * @version 5.209 and higher
		 * @memberof Lib.PO.Customization.Server
		 * @function OnPunchoutOrder
		 * @param {XMLDomElement} cxmlDoc Contains the cXML document ready to be sent to the supplier (shared secret will be set just after though)
		 * 		Update this document as needed
		 * @example
		 * <pre><code>
		 *	OnPunchoutOrder: function (cxmlDoc)
		 *	{
		 *		if (Data.GetValue("VendorNumber__") == "AMAZON" && Data.GetValue("Urgent__") == true)
		 *		{
		 *			// Add customer specific Urgent flag
		 *			var xml = '<Extrinsic name="Urgent">true</Extrinsic>';
		 *			var element = Process.CreateXMLDOMElement(xml);
		 *			var orderRequestHeaderNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader");
		 *			orderRequestHeaderNode.appendChild(element);
		 *		}
		 *	}
		 * </code></pre>
		*/
		OnPunchoutOrder: function (cxmlDoc)
		{

		}
	};

	return customization;
});
