///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_DD_VIRTUALFIELDSMANAGER_DIALOGS_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": []
}*/

var Lib;
Lib.DD_Client.AddLib("VirtualFieldsManagerDialogs", function ()
{
	var $virtualFieldsManager = null;
	var $noFamilyValue = "_No Family specified";
	var $controlTypeMapping = {
		Text: "ShortText"
		// note: add other types here (if the HTML Page Script type differs from the Flexible Form framework type)
	};

	function $GetControlType(control)
	{
		var type = control.GetType();
		return $controlTypeMapping[type] || type;
	}

	function $GetCurrentFieldsLabelsMap()
	{
		var fieldsLabelsMap = {};
		for (var i = 0; i < $virtualFieldsManager._current.length; i++)
		{
			var ctrl = $virtualFieldsManager._current[i];
			if ($virtualFieldsManager.IsCustomFieldDeleted(ctrl))
			{
				continue;
			}

			var translatedLabel = Language.Translate(ctrl.GetLabel(), false);
			if (fieldsLabelsMap[translatedLabel])
			{
				fieldsLabelsMap[translatedLabel].push(ctrl.GetName());
			}
			else
			{
				fieldsLabelsMap[translatedLabel] = [ctrl.GetName()];
			}
		}
		return fieldsLabelsMap;
	}

	function $GetAvailableValue(ctrlNode, indexToSkip)
	{
		var availableValue = [ctrlNode.name, "=", Language.Translate(ctrlNode.label, false)].join("");
		for (var i = 0; i < $virtualFieldsManager._availableCustomFieldsNodes.length; i++)
		{
			if (i !== indexToSkip && Language.Translate(ctrlNode.label, false) === Language.Translate($virtualFieldsManager._availableCustomFieldsNodes[i].label, false))
			{
				availableValue += " (" + ctrlNode.name + ")";
				break;
			}
		}
		return availableValue;
	}

	function $GetAvailableActivationValues(ctrlActivationCondition)
	{
		var availableValues = [];

		if (!Controls[$virtualFieldsManager._defaultActivationField.fieldName] || !Controls[$virtualFieldsManager._commonActivationField.fieldName])
		{
			return availableValues;
		}

		var defaultAvailableValues = Controls[$virtualFieldsManager._defaultActivationField.fieldName].GetAvailableValues();
		// Family__ comes differently than Document_Type__.... true just returns the values without keus
		var commonAvailableValues = Controls[$virtualFieldsManager._commonActivationField.fieldName].GetAvailableValues(true);

		if (ctrlActivationCondition.IsSelected("docTypes") && defaultAvailableValues)
		{
			availableValues = defaultAvailableValues;
		}
		else if (ctrlActivationCondition.IsSelected("families") && commonAvailableValues)
		{
			availableValues = commonAvailableValues;
			availableValues.unshift($noFamilyValue);
		}

		availableValues = availableValues.filter(function (item)
		{
			return ["", "=", Language.Translate("_NewDocumentType"), "+=" + Language.Translate("_NewDocumentType")].indexOf(item) === -1;
		});

		return availableValues.map(function (item)
		{
			return item + "=" + Language.Translate(item, false);
		});
	}

	function $GetSelectedActivationValues(ctrlActivationValues)
	{
		var selectedValues = ctrlActivationValues.GetSelectedOptions();

		var indexOfEmptyFamily = selectedValues.indexOf($noFamilyValue);
		if (indexOfEmptyFamily > -1)
		{
			selectedValues[indexOfEmptyFamily] = "";
		}

		return selectedValues;
	}

	function $GetAvailableExistingFieldsValues()
	{
		var existingFieldsAvailableValues = [];
		for (var i = 0; i < $virtualFieldsManager._availableCustomFieldsNodes.length; i++)
		{
			var ctrlNode = $virtualFieldsManager._availableCustomFieldsNodes[i];

			if (!ctrlNode.activationCondition || ctrlNode.isAvailable === false)
			{
				continue;
			}
			var availableValue = $GetAvailableValue(ctrlNode, i);
			existingFieldsAvailableValues.push(availableValue);
		}
		return existingFieldsAvailableValues;
	}

	function $RefeshLabelTranslation(control)
	{
		var label = control.GetLabel();
		control.SetLabel("");
		control.SetLabel(label);
		if (control.GetType() === "Link")
		{
			var url = control.GetURL();
			control.SetText(url);
		}
	}

	function $fillModifyField(dialog, tabId)
	{
		return $fillChooseField(dialog, tabId);
	}

	function $fillRemoveField(dialog, tabId)
	{
		dialog.SetHelpId(7020);
		return $fillChooseField(dialog, tabId);
	}

	function $fillChooseField(dialog, tabId)
	{
		if (!tabId)
		{
			var availableValues = [];
			var knownLabelsMap = $GetCurrentFieldsLabelsMap();
			var keys = Object.keys(knownLabelsMap);
			for (var labelIdx = 0; labelIdx < keys.length; labelIdx++)
			{
				var label = keys[labelIdx];
				if (knownLabelsMap[label].length > 1)
				{
					for (var nameIdx = 0; nameIdx < knownLabelsMap[label].length; nameIdx++)
					{
						var name = knownLabelsMap[label][nameIdx];
						availableValues.push([name, "=", label, " (", name, ")"].join(""));
					}
				}
				else
				{
					availableValues.push([knownLabelsMap[label][0], "=", label].join(""));
				}
			}

			var ctrlField = dialog.AddComboBox("ctrlField", "Field label");
			ctrlField.SetAvailableValues(availableValues);
		}
	}

	function $fillAddField(dialog, tabId)
	{
		dialog.SetHelpId(7018);
		var updatedControl = null;
		return $fillAddOrUpdateField(dialog, tabId, updatedControl);
	}

	function $fillUpdateField(dialog, tabId)
	{
		dialog.SetHelpId(7019);
		var updatedControl = this;
		return $fillAddOrUpdateField(dialog, tabId, updatedControl);
	}

	function $fillAddOrUpdateField(dialog, tabId, updatedControl)
	{
		// Callback from base dialog
		if (!tabId)
		{
			var ctrlExistence = dialog.AddRadioButton("ctrlExistence");
			ctrlExistence.SetAvailableValues(["NewField=_AddNewField", "ExistingField=_AddExistingField"]);
			ctrlExistence.SetValue("NewField");

			var ctrlExistingFieldDescription = dialog.AddDescription("ctrlExistingFieldDescription");
			var text = Language.Translate("_ctrlExistingFieldDescription {0}", false, Data.GetValue("Document_Type__"));
			ctrlExistingFieldDescription.SetText(text);
			dialog.HideControl(ctrlExistingFieldDescription);

			dialog.AddSeparator();

			var ctrlType = dialog.AddComboBox("ctrlType", "Field type", 200);
			ctrlType.SetText("ShortText=_Text\nInteger=_Integer\nDecimal=_Decimal\nDateTime=_Date\nDatabaseComboBox=_DatabaseComboBox\nLink=_Link");
			if (updatedControl)
			{
				ctrlType.SetValue($GetControlType(updatedControl));
				ctrlType.SetReadOnly(true);
			}
			else
			{
				ctrlType.SetValue("ShortText");
			}

			var ctrlLabelError = dialog.AddDescription("ctrlLabelError", "");
			ctrlLabelError.SetErrorStyle();
			dialog.HideControl(ctrlLabelError);

			var ctrlLabel = dialog.AddText("ctrlLabel", "Field label", 200);
			if (updatedControl)
			{
				ctrlLabel.SetValue(Language.Translate(updatedControl.GetLabel(), false));
			}
			ctrlLabel.SetMaxNumberOfCharacters(50 - $virtualFieldsManager.BuildFieldPrefix().length - "__".length);
			dialog.RequireControl(ctrlLabel);

			var ctrlActivationCondition = dialog.AddRadioButton("ctrlActivationCondition", "_Activation condition");
			ctrlActivationCondition.SetAvailableValues(["docTypes=_Activation document type", "families=_Activation family"]);
			if (updatedControl && updatedControl.GetAdditionalFieldInfo().activationCondition.field === "Family__")
			{
				ctrlActivationCondition.SetValue("families");
			}
			else
			{
				ctrlActivationCondition.SetValue("docTypes");
			}

			var documentTypesCtrl = dialog.AddComboBox("ctrlActivationValues", "_Activation value list", 200);
			var availableValues = $GetAvailableActivationValues(ctrlActivationCondition);
			documentTypesCtrl.SetHelpData("_dialogAddCustomField_documentTypesHelpText");
			if (updatedControl)
			{
				var activationValues = updatedControl.GetAdditionalFieldInfo().activationCondition.values;
				documentTypesCtrl.SetValue(activationValues[0]);
				documentTypesCtrl.SetAvailableValues(availableValues);
				documentTypesCtrl.SetMultiple(true);
				documentTypesCtrl.SelectOptions(activationValues);
			}
			else
			{
				documentTypesCtrl.SetValue($virtualFieldsManager._defaultActivationField.fieldValue);
				documentTypesCtrl.SetAvailableValues(availableValues);
				documentTypesCtrl.SetMultiple(true);
			}

			var ctrlActivationError = dialog.AddDescription("ctrlActivationError", "");
			ctrlActivationError.SetText("_At least one value is required !");
			ctrlActivationError.SetErrorStyle();
			dialog.HideControl(ctrlActivationError);
			dialog.AddDescription("ctrlInfo", "");

			var ctrlToRetrieve = dialog.AddComboBox("ctrlToRetrieve", "_Control to add", 200);
			var availableExistingFieldsValues = $GetAvailableExistingFieldsValues();
			if (updatedControl || availableExistingFieldsValues.length === 0)
			{
				dialog.HideControl(ctrlExistence);
			}
			else
			{
				ctrlToRetrieve.SetAvailableValues(availableExistingFieldsValues);
			}

			dialog.HideControl(ctrlToRetrieve);
			dialog.SetWidth("400px");
		}
	}

	function $commitAddField(dialog)
	{
		var updatedControl = null;
		return $commitAddOrUpdateField(dialog, updatedControl);
	}

	function $commitUpdateField(dialog)
	{
		var updatedControl = this;
		return $commitAddOrUpdateField(dialog, updatedControl);
	}

	function $commitAddOrUpdateField(dialog, updatedControl)
	{
		try
		{
			if (!updatedControl && $IsAddingExistingField(dialog))
			{
				var ctrlExistingFieldName = dialog.GetControl("ctrlToRetrieve").GetValue();
				$virtualFieldsManager.UpdateActivationData(ctrlExistingFieldName, $virtualFieldsManager._defaultActivationField.fieldValue);
			}
			else
			{
				var control = null;
				var label = dialog.GetControl("ctrlLabel").GetValue().trim();
				if (updatedControl)
				{
					control = updatedControl;
				}
				else
				{
					var uiType = dialog.GetControl("ctrlType").GetValue();
					var fieldName = $virtualFieldsManager.BuildFieldPrefix() + label + "__";
					var extraction = $virtualFieldsManager.BuildDefaultExtractionStructure();
					var ctrlNode = {
						name: fieldName,
						type: uiType,
						extraction: extraction
					};
					control = $virtualFieldsManager.CreateCustomField(ctrlNode);
				}
				var name = control.GetName();

				var ctrlActivationField = dialog.GetControl("ctrlActivationCondition");
				var isFamilyGrouped = ctrlActivationField.IsSelected("families");
				var ctrlActivationValues = dialog.GetControl("ctrlActivationValues");
				var selectedValues = $GetSelectedActivationValues(ctrlActivationValues);

				var activationData = $virtualFieldsManager.BuildActivationData(isFamilyGrouped, selectedValues);
				control.SetAdditionalFieldInfo(activationData);

				Language.AddCustomTranslation(name, label, ["de", "en", "es", "fr", "it", "nl-NL", "pt"]);

				$RefeshLabelTranslation(control);

				control = $virtualFieldsManager.UpdateCustomField(control, { modified: true });

				if (!updatedControl)
				{
					$virtualFieldsManager._current.push(control);
				}
				$virtualFieldsManager._pendingSave.push(name);
				$virtualFieldsManager._customFieldsReservedNames.push(label);
			}

			$virtualFieldsManager.HandleButtons();
		}
		catch (err)
		{
			Log.Error(err);
		}
	}

	function $validateAddField(dialog, tabId)
	{
		var updatedControl = null;
		return $validateAddOrUpdateField(dialog, tabId, updatedControl);
	}

	function $validateUpdateField(dialog, tabId)
	{
		var updatedControl = this;
		return $validateAddOrUpdateField(dialog, tabId, updatedControl);
	}

	function $validateAddOrUpdateField(dialog, tabId, updatedControl)
	{
		if (!tabId && !$IsAddingExistingField(dialog))
		{
			var ctrlLabel = dialog.GetControl("ctrlLabel");
			var fieldLabel = ctrlLabel.GetValue() ? ctrlLabel.GetValue().trim() : "";
			var ctrlLabelError = dialog.GetControl("ctrlLabelError");

			if (!fieldLabel)
			{
				return $SetCommitError(dialog, ctrlLabelError, "_Label is required !");
			}
			if (!$IsLabelAvailable(fieldLabel, updatedControl))
			{
				return $SetCommitError(dialog, ctrlLabelError, "_Label already existing");
			}

			if (!$IsValidActivationSelection(dialog))
			{
				return $SetCommitError(dialog, dialog.GetControl("ctrlActivationError"));
			}
		}
		return true;
	}

	function $handleAddOrUpdateField(dialog, tabId, event, control)
	{
		if (!tabId && event === "OnChange" && control.GetName() === "ctrlExistence")
		{
			var isExistingField = control.GetValue() === "ExistingField";
			dialog.HideControl(dialog.GetControl("ctrlToRetrieve"), !isExistingField);
			dialog.HideControl(dialog.GetControl("ctrlExistingFieldDescription"), !isExistingField);
			dialog.HideControl(dialog.GetControl("ctrlType"), isExistingField);
			dialog.HideControl(dialog.GetControl("ctrlLabel"), isExistingField);
			dialog.HideControl(dialog.GetControl("ctrlActivationCondition"), isExistingField);
			dialog.HideControl(dialog.GetControl("ctrlActivationValues"), isExistingField);
			dialog.RequireControl(dialog.GetControl("ctrlLabel"), !isExistingField);

			dialog.HideControl(dialog.GetControl("ctrlLabelError"));
			dialog.HideControl(dialog.GetControl("ctrlActivationError"));
		}
		if (!tabId && event === "OnChange" && control.GetName() === "ctrlActivationCondition")
		{
			var documentTypesCtrl = dialog.GetControl("ctrlActivationValues");
			var availableValues = $GetAvailableActivationValues(control);
			documentTypesCtrl.SetAvailableValues(availableValues);

			if (control.IsSelected("docTypes"))
			{
				documentTypesCtrl.SetValue($virtualFieldsManager._defaultActivationField.fieldValue);
			}
			else if ($virtualFieldsManager._commonActivationField.fieldValue)
			{
				documentTypesCtrl.SetValue($virtualFieldsManager._commonActivationField.fieldValue);
			}
			else
			{
				documentTypesCtrl.SetValue($noFamilyValue);
			}
		}
	}

	function $SetCommitError(dialog, errorCtrl, errorLabel)
	{
		if (errorLabel)
		{
			errorCtrl.SetText(errorLabel);
		}
		dialog.HideControl(errorCtrl, false);
		return false;
	}

	function $IsLabelAvailable(fieldLabel, control)
	{
		if (!fieldLabel)
		{
			return false;
		}
		if (control && fieldLabel === Language.Translate(control.GetLabel(), false))
		{
			return true;
		}
		var label = fieldLabel.toLowerCase().trim();
		for (var i = 0; i < $virtualFieldsManager._customFieldsReservedNames.length; i++)
		{
			if (label === $virtualFieldsManager._customFieldsReservedNames[i].toLowerCase().trim())
			{
				return false;
			}
		}
		return true;
	}

	function $IsValidActivationSelection(dialog)
	{
		var ctrlActivation = dialog.GetControl("ctrlActivationValues");
		var selectedOptions = ctrlActivation.GetSelectedOptions();
		if (!selectedOptions || selectedOptions.length === 0)
		{
			return false;
		}

		// force selected current document type or family whitin selection
		var ctrlActivationField = dialog.GetControl("ctrlActivationCondition");

		if (ctrlActivationField.IsSelected("docTypes") && selectedOptions.indexOf($virtualFieldsManager._defaultActivationField.fieldValue) === -1)
		{
			return false;
		}

		if (ctrlActivationField.IsSelected("families"))
		{
			var defaultFamilyValue = $virtualFieldsManager._commonActivationField.fieldValue || $noFamilyValue;

			if (selectedOptions.indexOf(defaultFamilyValue) === -1)
			{
				return false;
			}
		}

		return true;
	}

	function $IsAddingExistingField(dialog)
	{
		var ctrlExistence = dialog.GetControl("ctrlExistence");
		if (ctrlExistence.GetValue() === "ExistingField")
		{
			return true;
		}
		return false;
	}

	function $commitModifyField(dialog)
	{
		var ctrlToDelete = dialog.GetControl("ctrlField").GetValue();
		var fieldIndex = -1;
		for (var i = 0; i < $virtualFieldsManager._current.length; i++)
		{
			if ($virtualFieldsManager._current[i].GetName() === ctrlToDelete)
			{
				fieldIndex = i;
				break;
			}
		}
		if (fieldIndex === -1)
		{
			return;
		}

		var ctrl = $virtualFieldsManager._current[fieldIndex];
		$dialogsManager.UpdateField(ctrl);
	}

	function $FlagFieldAsAvailable(ctrlName)
	{
		for (var i = 0; i < $virtualFieldsManager._availableCustomFieldsNodes.length; i++)
		{
			var ctrlNode = $virtualFieldsManager._availableCustomFieldsNodes[i];
			if (ctrlNode.name === ctrlName)
			{
				ctrlNode.isAvailable = true;
				break;
			}
		}
	}

	function $commitRemoveField(dialog)
	{
		var ctrlToDelete = dialog.GetControl("ctrlField").GetValue();
		var fieldIndex = -1;
		for (var i = 0; i < $virtualFieldsManager._current.length; i++)
		{
			if ($virtualFieldsManager._current[i].GetName() === ctrlToDelete)
			{
				fieldIndex = i;
				break;
			}
		}
		if (fieldIndex === -1)
		{
			return;
		}

		var ctrl = $virtualFieldsManager._current[fieldIndex];
		var ctrlName = ctrl.GetName();
		if ($virtualFieldsManager._pendingSave.indexOf(ctrlName) !== -1)
		{
			// we can delete the control as it has never been saved
			$virtualFieldsManager._paneTargetControl.RemoveVirtualControl(ctrlName);
			$virtualFieldsManager._current.splice(fieldIndex, 1);
			$FlagFieldAsAvailable(ctrlName);
		}
		else
		{
			// we flag the control for further deletion when building serialization collection
			var info = ctrl.GetAdditionalFieldInfo();
			if (info)
			{
				info.isActive = false;
				$virtualFieldsManager._current[fieldIndex].SetAdditionalFieldInfo(info);
				ctrl.Hide(true);
			}
		}
		$virtualFieldsManager._customFieldsReservedNames.splice($virtualFieldsManager._customFieldsReservedNames.indexOf(ctrlName), 1);

		$virtualFieldsManager.HandleButtons();
	}

	//These functions will handle the dialog display and interactions when clicking on the Reorder_fields__ button
	function $fillReorderFields(dialog)
	{
		dialog.SetHelpId(7021);
		//Retrieve previously ordered fields
		var oldFieldsOrderedNames = $RetrieveOldFieldsOrder();
		//Get current fields to order
		var currentFieldsToOrder = $virtualFieldsManager._paneTargetControl.GetControls().filter(function (control)
		{
			return control.IsVisible();
		});
		var currentFieldsToOrderNames = $GetFieldNamesFromControlsArray(currentFieldsToOrder);
		//remove deleted fields from old order
		for (var idx = 0; idx < oldFieldsOrderedNames.length; idx++)
		{
			if (currentFieldsToOrderNames.indexOf(oldFieldsOrderedNames[idx]) === -1)
			{
				oldFieldsOrderedNames.splice(idx, 1);
			}
		}
		//compute the array of controls that have already been ordered
		var oldFieldsOrdered = $GetControlsArrayFromFieldNames(oldFieldsOrderedNames);
		//Get fields that have not been ordered yet
		var newFieldsToOrder = currentFieldsToOrder.filter(function (ctrl)
		{
			return oldFieldsOrderedNames.indexOf(ctrl.GetName()) === -1;
		});
		//Merge fields already ordered with new fields to order
		var finalFieldsToOrder = [];
		finalFieldsToOrder = oldFieldsOrdered.concat(newFieldsToOrder);
		dialog.AddDescription("desc_reorderFields", "_ReorderFieldsDescription");
		var fieldsListSelect = dialog.AddHTML("list_reorderFields");
		var htmlContent = $BuildHTMLContentToDisplay(finalFieldsToOrder);
		fieldsListSelect.SetHTML(htmlContent);
		fieldsListSelect.SetCSS("a{background-repeat:no-repeat!important;background-position:center!important;width:29px;height:29px;padding:2px 10px;cursor:pointer} #buttonUp{background:url(../img/skins/skin15/bouton_up-OFF.png)}#buttonDown{background:url(../img/skins/skin15/bouton_down-OFF.png)}#buttonUp:hover{background:url(../img/skins/skin15/bouton_up-ON.png)}#buttonDown:hover{background:url(../img/skins/skin15/bouton_down-ON.png)}");
	}

	function $commitReorderFields(dialog)
	{
		var htmlContent = dialog.GetControl("list_reorderFields").GetHTML();
		var regex = new RegExp('<option value="(.*)">.*<\/option>', 'gmi');
		var matchFound;
		var arrayFieldsOrdered = [];

		while ((matchFound = regex.exec(htmlContent)) !== null)
		{
			if (matchFound[1] === "Document_Type_SDAForm__")
			{
				//Document_Type_SDAForm__ is a clone of Document_type__ field
				arrayFieldsOrdered.push("Document_type__");
			}
			else
			{
				arrayFieldsOrdered.push(matchFound[1]);
			}
		}
		Controls.FieldsOrder__.SetValue(JSON.stringify(arrayFieldsOrdered));
	}

	function $BuildHTMLContentToDisplay(fieldsToOrder)
	{
		var htmlContent = '<div style="display: flex; align-items: center; justify-content: center;"><select id="fieldsList" style="flex: 10;" size="15">';
		for (var i = 0; i < fieldsToOrder.length; i++)
		{
			htmlContent += '<option value="' + fieldsToOrder[i].GetName() + '">' + Language.Translate(fieldsToOrder[i].GetLabel(), false) + '</option>\r\n';
		}
		htmlContent += '</select> \
		<div style="flex: 1;"> \
			<a id="buttonUp" style="display: block; margin: 8px;" onclick=" \
				var listID=\'fieldsList\'; \
				var direction=\'up\'; \
				var listbox = document.getElementById(listID); \
				var selIndex = listbox.selectedIndex; \
				if(-1 == selIndex) { return; } \
				var increment = -1; \
				if(direction == \'up\') \
					increment = -1; \
				else \
					increment = 1; \
				if((selIndex + increment) < 0 || (selIndex + increment) > (listbox.options.length-1)) \
				{ \
					return; \
				} \
				var selValue = listbox.options[selIndex].value; \
				var selText = listbox.options[selIndex].text; \
				listbox.options[selIndex].value = listbox.options[selIndex + increment].value; \
				listbox.options[selIndex].text = listbox.options[selIndex + increment].text; \
				listbox.options[selIndex + increment].value = selValue; \
				listbox.options[selIndex + increment].text = selText; \
				listbox.selectedIndex = selIndex + increment;"> \
			</a> \
			<a id="buttonDown" style="display: block; margin: 8px;" onclick=" \
				var listID=\'fieldsList\'; \
				var direction=\'down\'; \
				var listbox = document.getElementById(listID); \
				var selIndex = listbox.selectedIndex; \
				if(-1 == selIndex) { return; } \
				var increment = -1; \
				if(direction == \'up\') \
					increment = -1; \
				else \
					increment = 1; \
				if((selIndex + increment) < 0 || (selIndex + increment) > (listbox.options.length-1)) \
				{ \
					return; \
				} \
				var selValue = listbox.options[selIndex].value; \
				var selText = listbox.options[selIndex].text; \
				listbox.options[selIndex].value = listbox.options[selIndex + increment].value; \
				listbox.options[selIndex].text = listbox.options[selIndex + increment].text; \
				listbox.options[selIndex + increment].value = selValue; \
				listbox.options[selIndex + increment].text = selText; \
				listbox.selectedIndex = selIndex + increment;"> \
			</a> \
			</div> \
		</div>';
		return htmlContent;
	}

	function $RetrieveOldFieldsOrder()
	{
		var oldFieldsOrderedNames;
		try
		{
			oldFieldsOrderedNames = Controls.FieldsOrder__.GetValue() ? JSON.parse(Controls.FieldsOrder__.GetValue()) : $BuildDefaultFieldsOrder();
		}
		catch (err)
		{
			Log.Warn("Can't parse FieldsOrder__ value, maybe its length is too long ?");
			oldFieldsOrderedNames = $BuildDefaultFieldsOrder();
		}

		//Replace Document_type__ by Document_type_SDAForm__ to retrieve the right control in the configuration
		var idxDocumentType = oldFieldsOrderedNames.indexOf("Document_type__");
		if (idxDocumentType !== -1)
		{
			oldFieldsOrderedNames.splice(idxDocumentType, 1, "Document_Type_SDAForm__");
		}
		return oldFieldsOrderedNames;
	}

	function $BuildDefaultFieldsOrder()
	{
		//No order defined yet, taking default order
		var defaultFieldsOrderNames = Lib.DD.DocumentTypeManager.GetDefaultFieldsOrder();

		//Group all routing fields defined in DocumentTypeManager library to one field Routing_fields__
		var routingFieldsLength = Lib.DD.DocumentTypeManager.GetRoutingFieldsNames().length;
		var idxRoutingFields = defaultFieldsOrderNames.indexOf("Delivery_method__");
		if (idxRoutingFields !== -1)
		{
			defaultFieldsOrderNames.splice(idxRoutingFields, routingFieldsLength, "Routing_fields__");
		}

		//Remove all fields that should not be ordered by the user, as defined in DocumentTypeManager library
		var fieldsNotToOrder = ["Document_type_autolearn__", "Enable_touchless__"];
		for (var i = 0; i < fieldsNotToOrder.length; i++)
		{
			var idxFieldNotToOrder = defaultFieldsOrderNames.indexOf(fieldsNotToOrder[i]);
			if (idxFieldNotToOrder !== -1)
			{
				defaultFieldsOrderNames.splice(idxFieldNotToOrder, 1);
			}
		}

		return defaultFieldsOrderNames;
	}

	function $GetFieldNamesFromControlsArray(controlsArray)
	{
		if (!controlsArray || controlsArray.length === 0)
		{
			return [];
		}
		return controlsArray.map(function (control)
		{
			return control.GetName();
		});
	}
	function $GetControlsArrayFromFieldNames(fieldNamesArray)
	{
		if (!fieldNamesArray || fieldNamesArray.length === 0)
		{
			return [];
		}
		return fieldNamesArray.map(function (fieldName)
		{
			return Controls[fieldName];
		});
	}

	var $dialogsManager = {
		Init: function (virtualFieldsManager)
		{
			$virtualFieldsManager = virtualFieldsManager;
			return this;
		},
		AddField: function ()
		{
			return Popup.Dialog("Add an additional field", null, $fillAddField, $commitAddField, $validateAddField, $handleAddOrUpdateField);
		},
		UpdateField: function (updatedControl)
		{
			return Popup.Dialog(Language.Translate(updatedControl.GetLabel(), false), updatedControl, $fillUpdateField, $commitUpdateField, $validateUpdateField, $handleAddOrUpdateField);
		},
		ModifyField: function ()
		{
			return Popup.Dialog("_Modify an additional field", null, $fillModifyField, $commitModifyField);
		},
		RemoveField: function ()
		{
			return Popup.Dialog("_Remove an additional field", null, $fillRemoveField, $commitRemoveField);
		},
		ReorderFields: function ()
		{
			return Popup.Dialog("Reorder fields", null, $fillReorderFields, $commitReorderFields);
		},
		ConfigureFieldsMapping: function ()
		{
			var mappingAvailableValues_number = ["="];
			var mappingAvailableValues_date = ["="];
			var mappingAvailableValues_string = ["="];

			var $fillConfigureMapping = function (dialog)
			{
				dialog.SetHelpId(7004);
				dialog.SetWidth("600px");
				dialog.Hold(true);

				var getDestinationProcessFormData = function (response)
				{
					var json = JSON.parse(response.responseText);
					var fields = json.download.data.process.fields;

					var ctrlDescription = dialog.AddDescription("ctrlDescription");
					ctrlDescription.SetText(
						Language.Translate("_Fields mapping help", false)
					);

					var ctrlMappingTable = dialog.AddTable("ctrlMappingTable");

					ctrlMappingTable.AddDescriptionColumn("Col_field__", "_Col field");
					var ctrlType = ctrlMappingTable.AddComboBoxColumn("Col_type__", "_Col type");
					var ctrlMapping = ctrlMappingTable.AddComboBoxColumn("Col_mapping__", "_Col mapping");
					ctrlMappingTable.SetExtendableColumn("Col_mapping__");
					ctrlMappingTable.DisableMenuAddLine(true);
					ctrlMappingTable.DisableMenuInsertLine(true);
					ctrlMappingTable.HideTableRowMenu(true);

					var fieldNames = Object.keys(fields);

					for (var fieldIndex = 0; fieldIndex < fieldNames.length; fieldIndex++)
					{
						var field = fields[fieldNames[fieldIndex]];
						if (field.field && field.field.possiblekeys)
						{
							// Ignore combo boxes
							continue;
						}

						switch (field._type)
						{
							case "Number":
								mappingAvailableValues_number.push(field._name + "=" + field._name);
								break;
							case "Date":
								mappingAvailableValues_date.push(field._name + "=" + field._name);
								break;
							case "Enumeration":
								// Ignore tables
								continue;
							default:
								mappingAvailableValues_string.push(field._name + "=" + field._name);
								break;
						}
					}

					mappingAvailableValues_number.sort();
					mappingAvailableValues_date.sort();
					mappingAvailableValues_string.sort();

					ctrlMapping.SetWidth("100%");
					ctrlType.SetAvailableValues(["Text=_Text", "Integer=_Integer", "Decimal=_Decimal", "Date=_Date", "DatabaseComboBox=_DatabaseComboBox", "Link=_Link"]);
					ctrlType.SetReadOnly(true);

					for (var rowIndex = 0; rowIndex < $virtualFieldsManager._current.length; rowIndex++)
					{
						var currentRow = ctrlMappingTable.AddItem();
						var ctrl = $virtualFieldsManager._current[rowIndex];
						var info = ctrl.GetAdditionalFieldInfo();
						currentRow.SetValue("Col_field__", ctrl.GetLabel());
						currentRow.SetValue("Col_type__", ctrl.GetType());

						if (info && info.mappedTo)
						{
							currentRow.SetValue("Col_mapping__", info.mappedTo);
						}
					}

					dialog.Hold(false);
				};

				Query.HTTPQuery({
					type: "internalHttpQuery",
					processName: Data.GetValue("ProcessSelected__"),
					callback: getDestinationProcessFormData
				});
			};

			var $commitConfigureMapping = function (dialog)
			{
				var ctrlMappingTable = dialog.GetControl("ctrlMappingTable");
				for (var rowIndex = 0; rowIndex < $virtualFieldsManager._current.length; rowIndex++)
				{
					var currentRow = ctrlMappingTable.GetItem(rowIndex);
					var ctrl = $virtualFieldsManager._current[rowIndex];
					var mappedTo = currentRow.GetValue("Col_mapping__");
					ctrl.SetAdditionalFieldInfo({ mappedTo: mappedTo });
				}
			};

			var $handleDialogCallback = function (dialog, tabId, event, control, rowIndex)
			{
				switch (event)
				{
					case "OnRefreshRow":
						var ctrlMappingTable = dialog.GetControl("ctrlMappingTable");
						var row = ctrlMappingTable.GetRow(rowIndex);
						var type = row.Col_type__.GetValue();
						switch (type)
						{
							case "Integer":
							case "Decimal":
								row.Col_mapping__.SetAvailableValues(mappingAvailableValues_number);
								break;
							case "Date":
								row.Col_mapping__.SetAvailableValues(mappingAvailableValues_date);
								break;
							default:
								row.Col_mapping__.SetAvailableValues(mappingAvailableValues_string);
								break;
						}
						break;
					default:
						break;
				}
			};

			Popup.Dialog("_Configure fields mapping dialog title", null, $fillConfigureMapping, $commitConfigureMapping, null, $handleDialogCallback);
		}
	};
	return $dialogsManager;
});
