///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_DD_VIRTUALFIELDSMANAGER_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "Lib_DD_VirtualFieldsManager_Dialogs_V12.0.461.0"
  ]
}*/

var Lib;
Lib.DD_Client.AddLib("VirtualFieldsManager", function ()
{

	return {
		Common: {
			IsCommonFieldForCurrentFamily: function (ctrl, commonFieldValue)
			{
				if (!ctrl)
				{
					return false;
				}

				if (!commonFieldValue)
				{
					// test on empty Family for legacy outbound configurations
					commonFieldValue = "";
				}

				var info = ctrl.GetAdditionalFieldInfo();
				if (!info || !info.isAdditionalField || !info.isActive)
				{
					return false;
				}
				if (!info.activationCondition || info.activationCondition.values.length === 0)
				{
					return false;
				}
				return info.activationCondition.field === "Family__" && info.activationCondition.values.indexOf(commonFieldValue) !== -1;
			},
			IsCommonField: function (ctrl)
			{
				if (!ctrl)
				{
					return false;
				}

				var info = ctrl.GetAdditionalFieldInfo();
				if (!info || !info.isAdditionalField || !info.isActive)
				{
					return false;
				}
				if (!info.activationCondition || info.activationCondition.values.length === 0)
				{
					return false;
				}
				return info.activationCondition.field === "Family__";
			}
		},
		Wizard: {
			_btnAdd: null,
			_btnModify: null,
			_btnRemove: null,
			_btnReorder: null,
			_btnConfigureFieldsMapping: null,
			_paneTargetControl: null,
			// the current list of custom fields controls loaded in the wizard
			_current: [],
			// custom fields available to add for the current doctype
			_availableCustomFieldsNodes: [],
			// list of all existing custom fields names
			_customFieldsReservedNames: [],
			_pendingSave: [],
			_defaultActivationField: {},
			_commonActivationField: {},
			_isExtractionFriendly: false,
			Reset: function ()
			{
				this._btnAdd = null;
				this._btnModify = null;
				this._btnRemove = null;
				this._btnReorder = null;
				this._current = [];
				this._availableCustomFieldsNodes = [];
				this._customFieldsReservedNames = [];
				this._pendingSave = [];
				this._defaultActivationField = {};
				this._commonActivationField = {};
				this._isExtractionFriendly = false;
				this._paneTargetControl = null;
			},
			Init: function (params)
			{
				this._btnAdd = params.btnAdd;
				this._btnModify = params.btnModify;
				this._btnRemove = params.btnRemove;
				this._btnReorder = params.btnReorder;
				this._btnConfigureFieldsMapping = params.btnConfigureFieldsMapping;
				this._paneTargetControl = params.paneTargetControl;
				this._defaultActivationField = params.defaultActivationField || {};
				this._commonActivationField = params.commonActivationField || { fieldValue: "" };
				if (params.isExtractionFriendly)
				{
					this._isExtractionFriendly = params.isExtractionFriendly;
				}

				if (!this._commonActivationField.fieldValue)
				{
					this._commonActivationField.fieldValue = "";
				}

				this.LoadCustomFields(params);

				var dialogsManager = Lib.DD_Client.VirtualFieldsManagerDialogs.Init(this);
				if (this._btnAdd)
				{
					this._btnAdd.OnClick = function ()
					{
						dialogsManager.AddField();
					};
				}

				if (this._btnModify)
				{
					this._btnModify.OnClick = function ()
					{
						dialogsManager.ModifyField();
					};
				}

				if (this._btnRemove)
				{
					this._btnRemove.OnClick = function ()
					{
						dialogsManager.RemoveField();
					};
					this._btnRemove.SetDisabled(true);
				}

				if (this._btnReorder)
				{
					this._btnReorder.OnClick = function ()
					{
						dialogsManager.ReorderFields();
					};
				}

				if (this._btnConfigureFieldsMapping)
				{
					this._btnConfigureFieldsMapping.OnClick = function ()
					{
						dialogsManager.ConfigureFieldsMapping();
					};
				}

				this.HandleButtons();
			},
			LoadCustomFields: function (params)
			{
				if (!params)
				{
					return;
				}
				if (!params.customFieldsList)
				{
					return;
				}

				this._availableCustomFieldsNodes = [];
				this._customFieldsReservedNames = [];

				for (var i = 0; i < params.customFieldsList.length; i++)
				{
					var ctrlNode = params.customFieldsList[i];

					this._customFieldsReservedNames.push(Language.Translate(ctrlNode.name, false));

					if (ctrlNode.deleted || this.IsCustomFieldAlreadyLoaded(ctrlNode.name))
					{
						continue;
					}


					//Fill _availableCustomFieldsNodes only with fields that are not already visible for this document type and with its activation condition not set by family
					if (ctrlNode.activationCondition && ctrlNode.activationCondition.field === this._defaultActivationField.fieldName && ctrlNode.activationCondition.values.indexOf(this._defaultActivationField.fieldValue) === -1)
					{
						this._availableCustomFieldsNodes.push(ctrlNode);
						continue;
					}

					if (ctrlNode.type !== "Label")
					{
						try
						{
							if (!this.IsActiveCustomFieldNode(ctrlNode) || !this.IsCustomFieldRelatedToConfig(ctrlNode))
							{
								continue;
							}
							// this function adds the label automatically based on the name
							var control = this.CreateCustomField(ctrlNode);

							var info = control.GetAdditionalFieldInfo();
							if (ctrlNode.activationCondition)
							{
								info.activationCondition = ctrlNode.activationCondition;
							}

							if (ctrlNode.mappedTo)
							{
								info.mappedTo = ctrlNode.mappedTo;
							}

							control.SetAdditionalFieldInfo(info);

							control.SetLabel(ctrlNode.label);
							if (control.GetType() === "Link" && ctrlNode.options && ctrlNode.options.text)
							{
								control.SetText(ctrlNode.options.text);
							}
							control = this.UpdateCustomField(control, { modified: false });

							this._current.push(control);
						}
						catch (err)
						{
							Log.Error(err);
						}
					}
				}
			},
			ResetCustomFieldsMappings: function ()
			{
				for (var rowIndex = 0; rowIndex < this._current.length; rowIndex++)
				{
					var ctrl = this._current[rowIndex];
					ctrl.SetAdditionalFieldInfo({ mappedTo: null });
				}
			},
			BuildExtendedData: function (ctrlNode)
			{
				if (!ctrlNode.field)
				{
					return null;
				}
				var data = {
					fieldData: ctrlNode.field,
					db: {}
				};

				if (ctrlNode.db)
				{
					if (ctrlNode.db.length)
					{
						data.db.length = parseInt(ctrlNode.db.length, 10);
					}
					if (ctrlNode.db.precision)
					{
						data.db.precision = parseInt(ctrlNode.db.precision, 10);
					}
				}

				// browsable will be false on DatabaseComboBox if we create the CF without defining properties, so we don't want to overrride default options
				if (ctrlNode.type !== "DatabaseComboBox" || (ctrlNode.options && ctrlNode.options.browsable))
				{
					data.options = ctrlNode.options;
				}

				return data;
			},
			UnloadFields: function (fieldName, fieldValue)
			{
				if (fieldValue === Language.Translate("_NewDocumentType"))
				{
					//We're opening the new document type dialog, no need to unload custom fields yet
					return;
				}
				if (this._defaultActivationField && fieldValue === this._defaultActivationField.fieldValue)
				{
					//We have cancelled the creation of a new document type, no need to unload custom fields
					return;
				}
				var isCommonFieldUnload = fieldName === this._commonActivationField.fieldName;
				var ctrl;
				for (var i = this._current.length - 1; i >= 0; i--)
				{
					ctrl = this._current[i];
					if (isCommonFieldUnload && !Lib.DD_Client.VirtualFieldsManager.Common.IsCommonField(ctrl))
					{
						//We are changing the family, so we only want to keep fields related to the document type
						continue;
					}
					if (!isCommonFieldUnload && ctrl.GetAdditionalFieldInfo().activationCondition.field === this._commonActivationField.fieldName)
					{
						//We are changing the document type, so we only want to keep fields related to the family
						continue;
					}
					this._paneTargetControl.RemoveVirtualControl(ctrl.GetName());
					// force delete for common
					this._current.splice(i, 1);
				}
			},
			IsCustomFieldAlreadyLoaded: function (ctrlName)
			{
				if (!ctrlName)
				{
					return true;
				}
				var ctrl = null;
				for (var i = 0; i < this._current.length; i++)
				{
					ctrl = this._current[i];
					if (ctrl && ctrl.GetName() === ctrlName)
					{
						return true;
					}
				}

				return false;
			},
			IsCustomFieldDeleted: function (ctrl)
			{
				if (!ctrl)
				{
					return false;
				}
				var info = ctrl.GetAdditionalFieldInfo();
				return info && info.isActive === false;
			},
			IsActiveCustomFieldNode: function (fieldNode)
			{
				if (!fieldNode)
				{
					return false;
				}
				// careful, no camel case returned by query response
				var info = fieldNode.additionalFieldInfo || fieldNode.additionalfieldinfo;
				if (!info || !info.isadditionalfield || !info.isactive)
				{
					return false;
				}
				var isAdditional = info.isadditionalfield._v && info.isadditionalfield._v === "1";
				if (isAdditional)
				{
					return info && info.isactive._v && info.isactive._v === "1";
				}
				return false;
			},
			IsCustomFieldRelatedToConfig: function (fieldNode)
			{
				var activationCondition = fieldNode.activationCondition;
				if (activationCondition && activationCondition.field)
				{
					var activationFieldValue = "";
					if (activationCondition.field === this._commonActivationField.fieldName)
					{
						activationFieldValue = this._commonActivationField.fieldValue;
					}
					else if (activationCondition.field === this._defaultActivationField.fieldName)
					{
						activationFieldValue = this._defaultActivationField.fieldValue;
					}
					//var activationFieldValue = Data.GetValue(activationCondition.field) || "";
					return activationCondition.values.indexOf(activationFieldValue) !== -1;
				}

				return false;
			},
			HandleButtons: function ()
			{
				if (this._btnRemove || this._btnModify)
				{
					var that = this;
					var result = this._current.filter(function (ctrl)
					{
						return !that.IsCustomFieldDeleted(ctrl);
					});
					if (this._btnRemove)
					{
						this._btnRemove.SetDisabled(result.length === 0);
					}
					if (this._btnModify)
					{
						this._btnModify.SetDisabled(result.length === 0);
					}
				}
			},
			CreateUniqId: function ()
			{
				return (new Date().getTime() + Math.floor((Math.random() * 10000) + 1)).toString(16);
			},
			BuildFieldPrefix: function ()
			{
				return "CF_" + this.CreateUniqId() + "_";
			},
			CreateCustomField: function (ctrlNode)
			{
				var allowRuntimeExtractionInWizard = this._isExtractionFriendly && ctrlNode.type !== "Link";

				var extendedData = this.BuildExtendedData(ctrlNode);
				var control = this._paneTargetControl.AddVirtualControl(ctrlNode.name, ctrlNode.type, allowRuntimeExtractionInWizard, ctrlNode.extraction, extendedData);

				if (!control)
				{
					throw new Error("Cannot create control: " + ctrlNode.name + " of type: " + ctrlNode.type);
				}

				if (ctrlNode.type === "DateTime")
				{
					control.HideDatePickerButton(true);
				}

				Controls[control.GetName()] = control;

				return control;
			},
			UpdateCustomField: function (control, data)
			{
				return this._paneTargetControl.UpdateVirtualControl(control, data);
			},
			BuildActivationData: function (isFamilyGrouped, selectedValues)
			{
				var activationData = {
					isActive: true,
					isAdditionalField: true,
					activationCondition: {
						"field": this._defaultActivationField.fieldName,
						"values": [this._defaultActivationField.fieldValue || ""]
					}
				};

				if (isFamilyGrouped)
				{
					activationData.activationCondition = {
						"field": this._commonActivationField.fieldName,
						"values": [this._commonActivationField.fieldValue || ""]
					};
				}

				if (selectedValues && selectedValues.length > 0)
				{
					activationData.activationCondition.values = selectedValues;
				}

				return activationData;
			},
			UpdateActivationData: function (ctrlName, activationConditionValue)
			{
				for (var i = this._availableCustomFieldsNodes.length - 1; i >= 0; i--)
				{
					var ctrlNode = this._availableCustomFieldsNodes[i];
					if (ctrlNode.name === ctrlName && ctrlNode.activationCondition && ctrlNode.activationCondition.values.length > 0)
					{
						ctrlNode.activationCondition.values.push(activationConditionValue);
						var activationData = this.BuildActivationData(false, ctrlNode.activationCondition.values);

						// this function adds the label automatically based on the name
						var control = this.CreateCustomField(ctrlNode);
						control.SetAdditionalFieldInfo(activationData);

						this._current.push(control);
						this._pendingSave.push(control.GetName());
						this._availableCustomFieldsNodes[i].isAvailable = false;
					}
				}
			},
			GetCurrentExtractionDataFromCustomFields: function ()
			{
				var temporaryExtractionData = {};
				for (var i = 0; i < this._current.length; i++)
				{
					var extractionData = this._current[i].GetExtractionData();
					if (extractionData)
					{
						temporaryExtractionData[this._current[i].GetName()] = extractionData;
					}
				}

				return temporaryExtractionData;
			},
			BuildFieldNode: function (control, label, isFamilyGrouped)
			{
				var activationData = this.BuildActivationData(isFamilyGrouped);
				var info = control.GetAdditionalFieldInfo();
				if (info)
				{
					activationData = info;
				}

				var fieldNode = this._paneTargetControl.GetVirtualControlNode(control.GetName());
				var ctrlName = control.GetName();

				this.CheckFieldNodeErrors(control, fieldNode);

				if (!this.IsValidFieldNodeStructure(ctrlName, fieldNode))
				{
					return null;
				}

				// only keep enableRuntimeExtraction for wizard configuration
				if (fieldNode.node.options && fieldNode.node.options.enableRuntimeExtraction)
				{
					fieldNode.node.options.enableRuntimeExtraction = null;
				}

				var isDeleted = this.IsCustomFieldDeleted(control);

				return {
					field: {
						name: ctrlName,
						node: fieldNode.node,
						templateData: fieldNode.templateData,
						deleted: isDeleted,
						paneTarget: "Main_pane",
						activationData: activationData,
						translatedLabel: label
					}
				};
			},
			CheckFieldNodeErrors: function (control, fieldNode)
			{
				if (control.GetType() === "DatabaseComboBox" && !fieldNode.node.options.browsable)
				{
					Data.SetError(control.GetName(), "_This field needs to be configured");
				}
			},
			IsValidFieldNodeStructure: function (ctrlName, fieldNode)
			{
				if (!(ctrlName && fieldNode))
				{
					return false;
				}

				if (!fieldNode.node || !fieldNode.templateData)
				{
					return false;
				}

				return true;
			},
			BuildDefaultExtractionStructure: function ()
			{
				var structure = {
					"method": "area", "pageOrigin": "first", "area": "", "after": "", "before": "",
					"valueToSearch": "", "useRegexpMode": false, "matchCase": false, "replacements": []
				};
				if (!this._isExtractionFriendly)
				{
					structure.method = "none";
				}
				return structure;
			},
			IsFieldsUpdateDetected: function ()
			{
				for (var i = 0; i < this._current.length; i++)
				{

					if (this.IsCustomFieldDeleted(this._current[i]) || this._current[i].HasBeenUpdated())
					{
						return true;
					}
				}

				return false;
			},
			GetSerializedCollection: function ()
			{
				var collection = [];
				var ctrl, isFamilyGrouped, fieldNode;
				for (var i = 0; i < this._current.length; i++)
				{
					ctrl = this._current[i];
					if (!ctrl)
					{
						continue;
					}

					isFamilyGrouped = Lib.DD_Client.VirtualFieldsManager.Common.IsCommonFieldForCurrentFamily(ctrl, this._commonActivationField.fieldValue);
					fieldNode = this.BuildFieldNode(ctrl, ctrl.GetName(), isFamilyGrouped);
					if (fieldNode)
					{
						collection.push(fieldNode);
					}
				}

				return collection;
			},
			IsValidCollection: function ()
			{
				for (var i = 0; i < this._current.length; i++)
				{
					if (Data.GetError(this._current[i].GetName()))
					{
						return false;
					}
				}

				return true;
			},
			ResetCollectionError: function ()
			{
				for (var i = 0; i < this._current.length; i++)
				{
					if (Data.GetError(this._current[i].GetName()))
					{
						Data.SetError(this._current[i].GetName(), "");
					}
				}
			}
		},
		Document: {
			_paneTargetControl: null,
			_overwriteOutboundInit: false,
			_commonFields: [],
			Init: function (params)
			{
				ProcessInstance.SetSilentChange(true);
				this._paneTargetControl = params.paneTargetControl;
				this._overwriteOutboundInit = params.overwriteOutboundInit;

				var paneControls = this._paneTargetControl.GetControls();
				for (var i = 0; i < paneControls.length; i++)
				{
					var info = paneControls[i].GetAdditionalFieldInfo();
					if (!info || !info.isAdditionalField || !info.isActive)
					{
						continue;
					}

					// active fields with no activation condition can only be outbound custom fields so we force hide only if inbound related doc type
					if (!info.activationCondition && this._overwriteOutboundInit)
					{
						paneControls[i].Hide(true);
					}
					else
					{
						paneControls[i].RefreshVisibility();
					}
				}
				ProcessInstance.SetSilentChange(false);
			},
			GetActiveCustomFieldsNames: function ()
			{
				var customFieldsList = [];
				var paneControls = this._paneTargetControl.GetControls();
				for (var i = 0; i < paneControls.length; i++)
				{
					var info = paneControls[i].GetAdditionalFieldInfo();
					if (!info || !info.isAdditionalField || !info.isActive)
					{
						continue;
					}
					customFieldsList.push(paneControls[i].GetName());
				}
				return customFieldsList;
			},
			GetCommonFields: function (commonFieldName)
			{
				var commonFieldsList = [];
				if (!commonFieldName)
				{
					return commonFieldsList;
				}

				var paneControls = this._paneTargetControl.GetControls();

				for (var i = 0; i < paneControls.length; i++)
				{
					var info = paneControls[i].GetAdditionalFieldInfo();
					var ctrlName = paneControls[i].GetName();
					if (ctrlName && (this.IsOutboundField(info, ctrlName) || Lib.DD_Client.VirtualFieldsManager.Common.IsCommonFieldForCurrentFamily(paneControls[i], commonFieldName)))
					{
						commonFieldsList.push(paneControls[i].GetName());
					}
				}
				return commonFieldsList;
			},
			IsOutboundField: function (info, ctrlName)
			{
				if (!info || !info.isAdditionalField || !info.isActive)
				{
					return false;
				}

				return ctrlName.indexOf("Additional_field_") === 0;
			}
		}
	};
});
