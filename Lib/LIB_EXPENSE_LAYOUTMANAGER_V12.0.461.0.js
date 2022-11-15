///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_LayoutManager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense common library - layout manager (template, fields, overloading by expense type...)",
  "require": [
    "Lib_Expense_V12.0.461.0",
    "Lib_Expense_Report_TaxesComputations_V12.0.461.0",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Object"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var LayoutManager;
        (function (LayoutManager) {
            var FieldBehavior;
            (function (FieldBehavior) {
                FieldBehavior["Required"] = "Required";
                FieldBehavior["Optional"] = "Optional";
                FieldBehavior["Hidden"] = "Hidden";
            })(FieldBehavior = LayoutManager.FieldBehavior || (LayoutManager.FieldBehavior = {}));
            LayoutManager.templates = {};
            /**
             * Add a new template or overwrite an existing one. This template defines of layout in a context.
             * @param templateName - name of template
             * @param template - object defining a template
             * @param baseTemplate - name or list of name of template used as base for the new one
             */
            function AddTemplate(templateName, template, baseTemplate) {
                var _a;
                var baseTemplates = GetBaseTemplates(baseTemplate);
                if (baseTemplates.length > 0) {
                    baseTemplates.push(template);
                    template = (_a = Sys.Helpers).Extend.apply(_a, __spreadArray([true, {}], baseTemplates, false));
                }
                template.name = templateName;
                Sys.Helpers.Object.ForEach(template.fields, function (field, fieldName) {
                    field.name = fieldName;
                    field.documentsPanel = field.documentsPanel || false;
                    field.required = field.required || false;
                    field.readonly = field.readonly || false;
                    field.hidden = field.hidden || false;
                    field.overloadBehavior = field.overloadBehavior || null;
                    field.checkValidity = field.checkValidity || null;
                    field.visibilityCondition = field.visibilityCondition || null;
                    field.valueIfEmpty = field.valueIfEmpty || null;
                    if (field.overloadBehavior) {
                        field.overloadBehavior.ignoredIfHidden = Sys.Helpers.IsBoolean(field.overloadBehavior.ignoredIfHidden) ? field.overloadBehavior.ignoredIfHidden : true;
                    }
                    return field;
                });
                LayoutManager.templates[templateName] = template;
                // reset lists in order to recompute it when needed
                allFieldNames = null;
                allBehaviorFieldNames = null;
            }
            LayoutManager.AddTemplate = AddTemplate;
            /**
             * Get the current template or template specified by the name.
             * @param {string} [templateName] - name of template. If ommitted, current template.
             * @returns {IExpenseTemplate} instance of found template, null otherwise.
             */
            function GetTemplate(templateName) {
                if (templateName) {
                    return LayoutManager.templates[templateName] || null;
                }
                templateName = Data.GetValue("Template__") || "Standard";
                return GetTemplate(templateName) || GetTemplate("Standard");
            }
            LayoutManager.GetTemplate = GetTemplate;
            /**
             * According to the current template and potential overloading defined by the expense type,
             * this function returns the layout to render in this current context.
             * @returns {IExpenseLayout} layout to render
             */
            function GetLayout() {
                var template = GetTemplate();
                // clone it in order to overload and keep trace for new context changes
                template = Sys.Helpers.Clone(template);
                var fields = Sys.Helpers.Object.Values(template.fields);
                OverloadFieldBehaviors(fields);
                return {
                    templateName: template.name,
                    fields: fields
                };
            }
            LayoutManager.GetLayout = GetLayout;
            function GetBaseTemplates(baseTemplate) {
                var baseTemplates = [];
                if (baseTemplate) {
                    baseTemplates = (Sys.Helpers.IsArray(baseTemplate) ? baseTemplate : [baseTemplate])
                        .map(function (name) { return LayoutManager.templates[name]; })
                        .filter(function (tpl) { return !!tpl; });
                }
                return baseTemplates;
            }
            var documentsPanelEventWrapped = false;
            /**
             * Applying transformation on template according to the behavior fields.
             * @param {IExpenseTemplate} template template instance to overload
             */
            function OverloadFieldBehaviors(fields) {
                var _loop_1 = function (i) {
                    var field = fields[i];
                    if (field.overloadBehavior) {
                        var behavior = Data.GetValue(field.overloadBehavior.fieldName) || field.overloadBehavior.defaultValue;
                        if (behavior === FieldBehavior.Required) {
                            field.required = true;
                            field.hidden = false;
                            if (!documentsPanelEventWrapped && field.documentsPanel && Sys.ScriptInfo.IsClient()) {
                                var ctrl_1 = Sys.Helpers.Globals.Controls[field.name];
                                ctrl_1.OnDocumentDeleted = Sys.Helpers.Wrap(ctrl_1.OnDocumentDeleted, function (originalFn) {
                                    // eslint-disable-next-line prefer-rest-params,no-invalid-this
                                    originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                                    // When the attachment to remove is the currently selected document, the framework
                                    // will select the first attachment as the selected document and then reset the title
                                    // to the default value. To prevent this, we preselect the first document
                                    if (Attach.GetNbAttach() > 0) {
                                        ctrl_1.SetSelectedDocument(0);
                                    }
                                    Lib.Expense.LayoutManager.SetProcessedDocumentRequired(field.name, true);
                                });
                                ctrl_1.OnAttachmentDeleted = Sys.Helpers.Wrap(ctrl_1.OnAttachmentDeleted, function (originalFn) {
                                    // eslint-disable-next-line prefer-rest-params,no-invalid-this
                                    originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                                    if (Attach.GetNbAttach() > 0) {
                                        ctrl_1.SetSelectedDocument(0);
                                    }
                                    Lib.Expense.LayoutManager.SetProcessedDocumentRequired(field.name, true);
                                });
                                ctrl_1.OnAttachmentAdded = Sys.Helpers.Wrap(ctrl_1.OnAttachmentAdded, function (originalFn) {
                                    // eslint-disable-next-line prefer-rest-params,no-invalid-this
                                    originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                                    if (Attach.GetNbAttach() == 1) {
                                        ctrl_1.SetSelectedDocument(0);
                                    }
                                    Lib.Expense.LayoutManager.SetProcessedDocumentRequired(field.name, true);
                                });
                                documentsPanelEventWrapped = true;
                            }
                        }
                        else if (behavior === FieldBehavior.Optional) {
                            field.required = false;
                            field.hidden = false;
                        }
                        // Hidden and default
                        else if (field.overloadBehavior.ignoredIfHidden) {
                            // don't return this field
                            fields.splice(i, 1);
                        }
                        else {
                            field.required = false;
                            field.hidden = true;
                        }
                    }
                };
                for (var i = fields.length - 1; i >= 0; i--) {
                    _loop_1(i);
                }
            }
            function SetProcessedDocumentRequired(panelName, required) {
                if (Sys.ScriptInfo.IsClient()) {
                    var ctrl = Sys.Helpers.Globals.Controls[panelName];
                    // !!! Do not use IsDocumentLoaded() because, called from event OnAttachmentDeleted,
                    // IsDocumentLoaded() returns incorrect result.
                    if (required && (Attach.GetNbAttach() == 0 || !Attach.IsProcessedDocument(0))) {
                        ctrl.SetLabel("_The receipt is required");
                        ctrl.SetTitleColor("color2");
                    }
                    else {
                        if (!required) {
                            ctrl.SetLabel("_Attachments");
                        }
                        // else label is setted by the framework
                        ctrl.SetTitleColor("default");
                    }
                }
            }
            LayoutManager.SetProcessedDocumentRequired = SetProcessedDocumentRequired;
            function IsFieldEmpty(field) {
                if (Sys.ScriptInfo.IsServer()) {
                    return field.documentsPanel ? !Attach.GetProcessedDocument() : Data.IsNullOrEmpty(field.name);
                }
                return field.documentsPanel ? !Sys.Helpers.Globals.Controls[field.name].IsDocumentLoaded() : Sys.Helpers.IsEmpty(Data.GetValue(field.name));
            }
            /**
             * According to the current template and potential overloading defined by the expense type,
             * this function indicates if all required fields are filled.
             * @returns {boolean} true if required fields are filled, false otherwise.
             */
            function CheckAllLayoutRequiredFields() {
                Log.Info("LayoutManager.CheckAllLayoutRequiredFields - enter");
                var layout = GetLayout();
                var ret = Sys.Helpers.Array.Find(layout.fields, function (field) { return field.required && IsFieldEmpty(field); });
                if (ret) {
                    Log.Warn("LayoutManager.CheckAllLayoutRequiredFields - field: ".concat(ret.name, ", is empty"));
                }
                Log.Info("LayoutManager.CheckAllLayoutRequiredFields returns ".concat(!ret));
                return !ret;
            }
            LayoutManager.CheckAllLayoutRequiredFields = CheckAllLayoutRequiredFields;
            function SetRequiredFields(required) {
                var layout = GetLayout();
                layout.fields.forEach(function (field) {
                    if (field.required) {
                        if (field.documentsPanel) {
                            SetProcessedDocumentRequired(field.name, required);
                        }
                        else if (Sys.ScriptInfo.IsServer()) {
                            Data.SetRequired(field.name, required);
                        }
                        else {
                            Sys.Helpers.Globals.Controls[field.name].SetRequired(required);
                        }
                    }
                });
            }
            LayoutManager.SetRequiredFields = SetRequiredFields;
            /**
             * Fill empty fields with value : valueIfEmpty
             */
            function FillEmptyFields() {
                var layout = GetLayout();
                Sys.Helpers.Object.ForEach(layout.fields, function (field) {
                    if (Sys.Helpers.IsFunction(field.valueIfEmpty) && IsFieldEmpty(field)) {
                        var value = field.valueIfEmpty();
                        Data.SetValue(field.name, value);
                        Log.Warn("LayoutManager.FillEmptyFields - The field: ".concat(field.name, ", is fill with: ").concat(value, " because it was empty."));
                    }
                });
            }
            LayoutManager.FillEmptyFields = FillEmptyFields;
            function CheckFieldsValidity() {
                var layout = GetLayout();
                var returnError = true;
                Sys.Helpers.Object.ForEach(layout.fields, function (field) {
                    var fieldValidity = field.checkValidity && field.checkValidity();
                    if (fieldValidity === false) {
                        returnError = false;
                    }
                });
                return returnError;
            }
            LayoutManager.CheckFieldsValidity = CheckFieldsValidity;
            function CleanHiddenFields() {
                // For taxes
                var hidableFields = [
                    { field: "Vendor__", visibilityField: "VendorFieldBehaviour__", hiddenValue: "Hidden" },
                    { field: "TaxAmount1__", visibilityField: "TaxCode1__", hiddenValue: "" },
                    { field: "TaxAmount2__", visibilityField: "TaxCode2__", hiddenValue: "" },
                    { field: "TaxAmount3__", visibilityField: "TaxCode3__", hiddenValue: "" },
                    { field: "TaxAmount4__", visibilityField: "TaxCode4__", hiddenValue: "" },
                    { field: "TaxAmount5__", visibilityField: "TaxCode5__", hiddenValue: "" }
                    // CostCenterFieldBehaviour__ is not in this table as it should not be reset when hidden
                ];
                hidableFields.forEach(function (hidableField) {
                    if (!hidableField.visibilityField || Data.GetValue(hidableField.visibilityField) == hidableField.hiddenValue) {
                        Data.SetValue(hidableField.field, "");
                    }
                });
                // For all other fields managed by templates
                Lib.Expense.LayoutManager.GetFieldNames(Lib.Expense.LayoutManager.FieldSelector.Ignored)
                    .forEach(function (fieldName) {
                    return Sys.Helpers.Data.IsBooleanField(fieldName) ? Data.SetValue(fieldName, false) : Data.SetValue(fieldName, "");
                });
                if (!Data.GetValue("LocalCurrency__")) {
                    Data.SetValue("ExchangeRate__", 1);
                }
                // Remove processed document
                if (Sys.ScriptInfo.IsClient() && Data.GetValue("ReceiptBehaviour__") === "Hidden" &&
                    Attach.GetNbAttach() > 0 && Attach.IsProcessedDocument(0)) {
                    Attach.RemoveAttach(0);
                }
            }
            LayoutManager.CleanHiddenFields = CleanHiddenFields;
            var FieldSelector;
            (function (FieldSelector) {
                FieldSelector[FieldSelector["All"] = 0] = "All";
                FieldSelector[FieldSelector["Used"] = 1] = "Used";
                // not declared in template and ignored by overloadBehavior
                FieldSelector[FieldSelector["Ignored"] = 2] = "Ignored";
            })(FieldSelector = LayoutManager.FieldSelector || (LayoutManager.FieldSelector = {}));
            var allFieldNames = null;
            /**
             * According to the added templates and current layout, this method returns the list of field names used. This list
             * varries according to the selector.
             * @param {FieldSelector} [selector=FieldSelector.All] allowing to specify what user wants to retrieve
             * @returns {string[]} list of field names.
             */
            function GetFieldNames(selector) {
                if (selector === void 0) { selector = FieldSelector.All; }
                var allNeeded = selector === FieldSelector.All || selector === FieldSelector.Ignored;
                if (!allFieldNames && allNeeded) {
                    var distinctFieldList_1 = {};
                    Sys.Helpers.Object.ForEach(LayoutManager.templates, function (template) {
                        Sys.Helpers.Object.ForEach(template.fields, function (field) {
                            if (!field.documentsPanel) {
                                distinctFieldList_1[field.name] = true;
                            }
                        });
                    });
                    allFieldNames = Object.keys(distinctFieldList_1);
                }
                if (selector === FieldSelector.All) {
                    return allFieldNames;
                }
                var layout = GetLayout();
                var distinctList = {};
                Sys.Helpers.Object.ForEach(layout.fields, function (field) {
                    if (!field.documentsPanel) {
                        distinctList[field.name] = true;
                    }
                });
                if (selector === FieldSelector.Used) {
                    return Object.keys(distinctList);
                }
                if (selector === FieldSelector.Ignored) {
                    return allFieldNames.reduce(function (list, fieldName) {
                        if (!(fieldName in distinctList)) {
                            list.push(fieldName);
                        }
                        return list;
                    }, []);
                }
                return [];
            }
            LayoutManager.GetFieldNames = GetFieldNames;
            var allBehaviorFieldNames = null;
            /**
             * According to the added templates, this method returns the list of field names can modify the behavior
             * of some template fields. This list varries according to the selector.
             * @param {FieldSelector} [selector=FieldSelector.All] allowing to specify what user wants to retrieve
             * @returns {string[]} list of field names.
             */
            function GetBehaviorFieldNames(selector) {
                if (selector === void 0) { selector = FieldSelector.All; }
                var allNeeded = selector === FieldSelector.All || selector === FieldSelector.Ignored;
                if (!allBehaviorFieldNames && allNeeded) {
                    var distinctBehaviorFieldList_1 = {};
                    Sys.Helpers.Object.ForEach(LayoutManager.templates, function (tpl) {
                        Sys.Helpers.Object.ForEach(tpl.fields, function (field) {
                            if (field.overloadBehavior) {
                                distinctBehaviorFieldList_1[field.overloadBehavior.fieldName] = true;
                            }
                        });
                    });
                    allBehaviorFieldNames = Object.keys(distinctBehaviorFieldList_1);
                }
                if (selector === FieldSelector.All) {
                    return allBehaviorFieldNames;
                }
                var template = GetTemplate();
                var distinctList = {};
                Sys.Helpers.Object.ForEach(template.fields, function (field) {
                    if (field.overloadBehavior) {
                        distinctList[field.overloadBehavior.fieldName] = true;
                    }
                });
                if (selector === FieldSelector.Used) {
                    return Object.keys(distinctList);
                }
                else if (selector === FieldSelector.Ignored) {
                    return allBehaviorFieldNames.reduce(function (list, fieldName) {
                        if (!(fieldName in distinctList)) {
                            list.push(fieldName);
                        }
                        return list;
                    }, []);
                }
                return [];
            }
            LayoutManager.GetBehaviorFieldNames = GetBehaviorFieldNames;
            // BUILTIN TEMPLATES
            AddTemplate("Standard", {
                fields: {
                    OwnerName__: {
                        required: true,
                        valueIfEmpty: function () {
                            var ownerName = null;
                            if (Sys.ScriptInfo.IsClient()) {
                                ownerName = Sys.Helpers.Globals.User.fullName;
                            }
                            else {
                                ownerName = Lib.P2P.GetValidatorOrOwner().GetValue("displayname");
                            }
                            return ownerName;
                        },
                        readonly: !!Data.GetValue("state"),
                        visibilityCondition: function () { return Lib.Expense.OwnerNameFieldIsVisible(); }
                    },
                    ExpenseType__: { required: true },
                    Date__: { required: true },
                    TotalAmount__: {
                        required: true, checkValidity: function () {
                            var computerError = null;
                            if (Data.GetValue("InputTaxRate__") === true) {
                                var taxLines = [];
                                for (var i = 1; i <= 5; i++) {
                                    if (!Sys.Helpers.IsEmpty(Data.GetValue("TaxCode" + i + "__"))) {
                                        var taxAmount = Data.GetValue("TaxAmount" + i + "__");
                                        var taxRate = Data.GetValue("TaxRate" + i + "__");
                                        taxLines.push({
                                            taxAmount: taxAmount ? taxAmount : 0,
                                            taxCode: Data.GetValue("TaxCode" + i + "__"),
                                            taxRate: taxRate ? taxRate : 0
                                        });
                                    }
                                }
                                computerError = Lib.Expense.Report.TaxesComputations.ComputeNetAmounts(taxLines, Data.GetValue("TotalAmount__") || 0);
                            }
                            if (computerError === Lib.Expense.Report.TaxesComputations.BalanceNetAmountsErrorCode.TaxAmountTooBig) {
                                return false;
                            }
                            return true;
                        }
                    },
                    TotalAmountCurrency__: { required: true },
                    ExchangeRate__: {
                        required: true,
                        visibilityCondition: function () {
                            if (Sys.Helpers.IsEmpty(Data.GetValue("LocalCurrency__")) || (Data.GetValue("LocalCurrency__") === Data.GetValue("TotalAmountCurrency__"))) {
                                return false;
                            }
                            return true;
                        },
                        checkValidity: function () {
                            return Data.GetValue("ExchangeRate__") > 0;
                        },
                        valueIfEmpty: function () {
                            return 1;
                        }
                    },
                    LocalAmount__: {
                        required: true,
                        visibilityCondition: function () {
                            if (Sys.Helpers.IsEmpty(Data.GetValue("LocalCurrency__")) || (Data.GetValue("LocalCurrency__") === Data.GetValue("TotalAmountCurrency__"))) {
                                return false;
                            }
                            return true;
                        },
                        valueIfEmpty: function () {
                            return new Sys.Decimal(Data.GetValue("TotalAmount__") || 0).mul(Data.GetValue("ExchangeRate__") || 1).toNumber();
                        }
                    },
                    Refundable__: {},
                    CompanyCode__: { required: true, hidden: true },
                    Vendor__: { overloadBehavior: { fieldName: "VendorFieldBehaviour__", defaultValue: FieldBehavior.Hidden } },
                    Billable__: { overloadBehavior: { fieldName: "BillableFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true } },
                    CostCenterName__: { overloadBehavior: { fieldName: "CostCenterFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true, ignoredIfHidden: false } },
                    ProjectCodeDescription__: { overloadBehavior: { fieldName: "ProjectCodeFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true, ignoredIfHidden: false } },
                    DocumentsPanel: {
                        documentsPanel: true,
                        overloadBehavior: { fieldName: "ReceiptBehaviour__", defaultValue: FieldBehavior.Optional, keepValueWhenChangingTemplate: true, ignoredIfHidden: false }
                    }
                }
            });
            AddTemplate("Distance", {
                fields: {
                    OwnerName__: {
                        required: true,
                        valueIfEmpty: function () {
                            var ownerName = null;
                            if (Sys.ScriptInfo.IsClient()) {
                                ownerName = Sys.Helpers.Globals.User.fullName;
                            }
                            else {
                                ownerName = Lib.P2P.GetValidatorOrOwner().GetValue("displayname");
                            }
                            return ownerName;
                        },
                        readonly: !!Data.GetValue("state"),
                        visibilityCondition: function () { return Lib.Expense.OwnerNameFieldIsVisible(); }
                    },
                    ExpenseType__: { required: true },
                    Date__: { required: true },
                    TotalAmount__: { required: true, readonly: true, defaultValue: 0 },
                    TotalAmountCurrency__: { required: true, readonly: true },
                    ExchangeRate__: {
                        required: true, hidden: true,
                        valueIfEmpty: function () {
                            return 1;
                        }
                    },
                    LocalAmount__: {
                        required: true, hidden: true,
                        valueIfEmpty: function () {
                            return new Sys.Decimal(Data.GetValue("TotalAmount__") || 0).mul(Data.GetValue("ExchangeRate__") || 1).toNumber();
                        }
                    },
                    Refundable__: { defaultValue: true, hidden: true },
                    CompanyCode__: { required: true, hidden: true },
                    VehicleTypeName__: { required: true, defaultValue: "" },
                    VehicleTypeID__: { hidden: true, defaultValue: "" },
                    MileageRate1__: { required: true, hidden: true, defaultValue: 0 },
                    Distance__: { required: true, defaultValue: 0 },
                    From__: { required: true, defaultValue: "" },
                    To__: { required: true, defaultValue: "" },
                    Billable__: { overloadBehavior: { fieldName: "BillableFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true } },
                    CostCenterName__: { overloadBehavior: { fieldName: "CostCenterFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true, ignoredIfHidden: false } },
                    ProjectCodeDescription__: { overloadBehavior: { fieldName: "ProjectCodeFieldBehaviour__", defaultValue: FieldBehavior.Hidden, keepValueWhenChangingTemplate: true, ignoredIfHidden: false } },
                    DocumentsPanel: {
                        documentsPanel: true,
                        overloadBehavior: { fieldName: "ReceiptBehaviour__", defaultValue: FieldBehavior.Optional, keepValueWhenChangingTemplate: true, ignoredIfHidden: false }
                    }
                }
            });
            AddTemplate("Restaurant", {
                fields: {
                    Vendor__: { overloadBehavior: { fieldName: "VendorFieldBehaviour__", defaultValue: FieldBehavior.Optional } }
                }
            }, "Standard");
            AddTemplate("Hotel", {}, "Standard");
            AddTemplate("Fuel/Gas", {}, "Standard");
        })(LayoutManager = Expense.LayoutManager || (Expense.LayoutManager = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
