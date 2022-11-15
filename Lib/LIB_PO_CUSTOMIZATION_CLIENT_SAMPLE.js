/**
 * @file Lib.PO.Customization.Client library: client script Purchase Requisition customization callbacks
 */

/**
 * Package Purchase Requisition client script customization callbacks
 * @namespace Lib.PO.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_PO_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Purchase order scripts on client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Client", function ()
{
	/**
	 * @lends Lib.PO.Customization.Client
	 */
	var customization = {

		/**
		 * This function will be called at the purchase order loading; just before calling the Start function.
		 * If you return a promise object, we synchronize on it before calling the Start function.
		 * @example
		 * <pre><code>
		 * OnLoad: function ()
		 * {
		 * 	// Initialize company code
		 * 	Data.SetValue("CompanyCode__", "US01");
		 * }
		 * </code></pre>
		 */
		OnLoad: function ()
		{
		},

		/**
		 * @description Allows you to customize the Purchase Order process form. This user exit is called from the HTML page script of the Purchase Order process, after loading the form.
		 * 		This user exit is typically used to customize:
		 * 			Objects from the included script libraries.
		 * 			Objects from the HTML page script.
		 * @version 5.127 and higher
		 * @memberof Lib.PO.Customization.Client
		 * @function CustomizeLayout
		 * @example Exemple 1:
		 * The following user exit hides the z_ProjectCode__ field.
		 *
			  CustomiseLayout: function ()
			  {
					Controls.LineItems__.z_ProjectCode__.Hide(true);
					Controls.LineItems__.z_ProjectCode__.SetReadOnly(true);
			  }
		 *
		 * @example Example 2:
		 * When editing a purchase order, only the Req delivery date fields of the Items table can be modified. The following user exit allows you to make the Expense category ID fields editable.
		 *
			  if (ProcessInstance.isEditing)
			  {
					var table = Controls.LineItems__;

					table.ItemGroup__.Hide(false);

					var lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
					for (var i = lineItemsCount - 1; i >= 0; i--)
					{
						var row = table.GetRow(i);
						if (!row.ItemDeliveryComplete__.IsChecked())
						{
							row.ItemGroup__.SetReadOnly(false);
						}
					};

					Lib.Purchasing.POEdition.ChangesManager.Watch("ItemGroup__", "LineItems__");
			 }
		 *
		 * If the Items table contains several pages, only the controls in the visible page are editable. When navigating to a new page of the table, the controls should be made editable when they are displayed. To do so, implement the OnRefreshRow event:
		 *
			  Controls.LineItems__.OnRefreshRow = Sys.Helpers.Wrap(Controls.LineItems__.OnRefreshRow, function (originalFn, index)
			  {
					originalFn.apply(this, Array.prototype.slice.call(arguments, 1));

					if (Data.GetValue("OrderStatus__") === "To receive" && ProcessInstance.isEditing)
					{
						var row = Controls.LineItems__.GetRow(index);
						row.ItemGroup__.SetReadOnly(row.ItemDeliveryComplete__.IsChecked());
					}
			  }
		 */
		CustomizeLayout: function ()
		{
			/*
			var changeDescription = false;	// For change Description
			var changeGlAccount = false;	// For change GlAccount

			var status = Data.GetValue("OrderStatus__");
			if (status === "To receive" && ProcessInstance.isEditing && (changeDescription || changeGlAccount))
			{
				var table = Controls.LineItems__;
				var lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
				for (var i = lineItemsCount - 1; i >= 0; i--)
				{
					var row = table.GetRow(i);
					if (changeDescription)
					{
						row.ItemDescription__.SetReadOnly(false);
					}
					if (changeGlAccount && row.ItemUndeliveredQuantity__.GetValue() == row.ItemQuantity__.GetValue())
					{
						// GlAccount changeable only for items without delivery started
						row.ItemGLAccount__.SetReadOnly(false);
					}
				}
				if (changeGlAccount)
				{
					table.ItemGLAccount__.Hide(false);
				}
				var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
				if (!nextAlert || !nextAlert.isError)
				{
					if (changeDescription)
					{
						Lib.Purchasing.POEdition.ChangesManager.Watch("ItemDescription__", "LineItems__");
					}
					if (changeGlAccount)
					{
						Lib.Purchasing.POEdition.ChangesManager.Watch("ItemGLAccount__", "LineItems__");
						Lib.Purchasing.POEdition.ChangesManager.Watch("ItemGroup__", "LineItems__");
					}
				}
			}
			*/
		}
	};

	return customization;
});
