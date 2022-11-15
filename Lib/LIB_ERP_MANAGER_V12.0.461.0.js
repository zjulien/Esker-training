/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base manager for ERP",
  "require": [
    "Sys/Sys_Helpers",
    "Lib_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Manager;
        (function (Manager) {
            Manager.factories = {};
            var Instance = /** @class */ (function () {
                function Instance(ERPName) {
                    // Stores the name of ERP used
                    this.ERPName = ERPName;
                    // defining all properties used by ERP manager
                    this.definition = {
                        // configuration string to ERP
                        configuration: null,
                        // Mapping between the manager and process fields (realname, value or function)
                        managerToProcessFields: {},
                        // Process tables declaraction based on manager names.
                        managerToProcessTables: {},
                        // Mapping between the manager and ERP names
                        ERPToManagerNames: {},
                        // Enable or disable creation of documents in ERP
                        createDocInERP: true,
                        // global callbacks on error/warning notification
                        OnError: null,
                        OnWarning: null
                    };
                    // documents instantiated by this manager
                    this.documents = {};
                }
                //////////////////////////////////////////
                // Public ERPManager interface (virtual)
                //////////////////////////////////////////
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Instance.prototype.Init = function () {
                    var _params = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _params[_i] = arguments[_i];
                    }
                    return true;
                };
                Instance.prototype.Finalize = function () {
                    // do nothing
                };
                Instance.prototype.GetDocument = function (type) {
                    if (type in this.documents) {
                        return this.documents[type];
                    }
                    if (Sys.Helpers.IsFunction(this.documentFactories[type])) {
                        this.documents[type] = this.documentFactories[type](this);
                        return this.documents[type];
                    }
                    Log.Error("No ERP document with type '" + type + "' defined for the manager with ERPName '" + this.ERPName + "'");
                    return null;
                };
                Instance.prototype.ExtendDefinition = function (definition) {
                    Sys.Helpers.Extend(true, this.definition, definition);
                };
                Instance.prototype.NotifyError = function (msg) {
                    if (Sys.Helpers.IsFunction(this.definition.OnError)) {
                        this.definition.OnError.call(this, msg);
                    }
                    else {
                        Log.Error(msg);
                    }
                };
                Instance.prototype.NotifyWarning = function (msg) {
                    if (Sys.Helpers.IsFunction(this.definition.OnWarning)) {
                        this.definition.OnWarning.call(this, msg);
                    }
                    else {
                        Log.Warn(msg);
                    }
                };
                Instance.prototype.GetValue = function (ERPFieldName, DataObject) {
                    var fieldName = this.definition.ERPToManagerNames[ERPFieldName] || ERPFieldName;
                    var field = this.definition.managerToProcessFields[fieldName];
                    if (!field) {
                        this.NotifyError("No fields for " + fieldName);
                        return null;
                    }
                    if (Sys.Helpers.IsDefined(field.value)) {
                        return field.value;
                    }
                    DataObject = DataObject || Data;
                    if (Sys.Helpers.IsFunction(field)) {
                        return field(DataObject);
                    }
                    if (field.realName) {
                        return DataObject.GetValue(field.realName);
                    }
                    return DataObject.GetValue(fieldName);
                };
                Instance.prototype.SimpleDocCreation = function (type, createDocInERPCallback) {
                    var docData = {};
                    if (this.definition.createDocInERP && Sys.Helpers.IsFunction(createDocInERPCallback)) {
                        docData = createDocInERPCallback.call(this.GetDocument(type)) || {};
                    }
                    return docData;
                };
                //////////////////////////////////////////
                // Protected ERPManager methods (sealed)
                //////////////////////////////////////////
                Instance.prototype.ERPToProcessField = function (ERPFieldName) {
                    var fieldName = this.definition.ERPToManagerNames[ERPFieldName] || ERPFieldName;
                    var field = this.definition.managerToProcessFields[fieldName];
                    return field && field.realName ? field.realName : fieldName;
                };
                return Instance;
            }());
            Manager.Instance = Instance;
            var Document = /** @class */ (function () {
                function Document() {
                }
                return Document;
            }());
            Manager.Document = Document;
        })(Manager = ERP.Manager || (ERP.Manager = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
