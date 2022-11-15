/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ERP library",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Parameters",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Lib_ERP_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        /**
         * Create a new ERP manager according to the ERP name.
            * @param {string} ERPName the ERP name to use. A factory with the same name must be registered.
            * @returns {object} Lib.ERP.Manager object
            */
        function CreateManager(ERPName) {
            if (Lib.ERP.IsSupportedManager(ERPName)) {
                return Lib.ERP.Manager.factories[ERPName]();
            }
            Log.Error("No ERP manager defined for ERPName: ".concat(ERPName));
            return null;
        }
        ERP.CreateManager = CreateManager;
        /**
         * Create a new ERP manager according to the MSNEX.
            * @param {string} tableName A string with the name of the table to query
            * @param {string} msnEx the MSNEX of a record
            * @param {function} callback A callback function which will receive the ERPManager as the first parameter
            */
        function CreateManagerFromRecord(tableName, filter, callback) {
            var queryOptions = { searchInArchive: true };
            Sys.GenericAPI.Query(tableName, filter, ["ERP__"], function (result, error) {
                var erpManager = null;
                if (!error && result.length !== 0) {
                    erpManager = Lib.ERP.CreateManager(result[0].ERP__);
                }
                callback(erpManager);
            }, null, 1, queryOptions);
        }
        ERP.CreateManagerFromRecord = CreateManagerFromRecord;
        /**
         * Returns if an ERP manager is registered with the specified ERP name.
            * @param {string} ERPName the ERP name to test.
            * @returns {boolean}
            */
        function IsSupportedManager(ERPName) {
            return Sys.Helpers.IsFunction(Lib.ERP.Manager.factories[ERPName]);
        }
        ERP.IsSupportedManager = IsSupportedManager;
        /**
         * Returns the ERP name setup in the configuration or in Variable
            * @param {string} [parameterInstance=] Name of the parameters instance to use to read the ERP value (optional).
            */
        function GetConfigurationERP(parameterInstance) {
            if (parameterInstance) {
                var ERPName = Sys.Parameters.GetInstance(parameterInstance).GetParameter("ERP");
                if (!ERPName || !this.IsSupportedManager(ERPName)) {
                    ERPName = Sys.Parameters.GetInstance(parameterInstance).GetDefaultParameter("ERP");
                }
                return ERPName;
            }
            return Variable.GetValueAsString("ERP");
        }
        ERP.GetConfigurationERP = GetConfigurationERP;
        /**
         * Initlialize (serialize) the ERP name on record either in Data field "ERP__" if exists or in Variable "ERP"
            *
            * When the field "ERP__" is a combobox, it's important to call this method in order to initialize its value
            * because it can't be null and to avoid GetERPName always returns the first value of combobox.
            *
            * @param {string} [ERPName] the ERP name to use. If undefined, get the value of Variable "ERP".
            * @param {boolean} [force=false] set the ERP name even if it's already done.
            * @param {string} [parameterInstance=] Name of the parameters instance to use to read the ERP value (optional).
            */
        function InitERPName(ERPName, force, parameterInstance) {
            // already initialized -> skip
            if (!force) {
                var initialized = Sys.Helpers.String.ToBoolean(Variable.GetValueAsString("ERP_initialized"));
                if (initialized) {
                    return;
                }
            }
            ERPName = ERPName || this.GetConfigurationERP(parameterInstance);
            if (ERPName && this.IsSupportedManager(ERPName)) {
                // Try to serialize in Data field ERP__. If it doesn't exist we serialize this value in a variable.
                var fieldERPSet = false;
                if (Sys.ScriptInfo.IsServer() || ("ERP__" in Sys.Helpers.Globals.Controls)) {
                    fieldERPSet = Data.SetValue("ERP__", ERPName);
                }
                // true: set, null: already set
                if (fieldERPSet === false) {
                    Variable.SetValueAsString("ERP", ERPName);
                }
                Variable.SetValueAsString("ERP_initialized", "1");
            }
            else {
                Log.Error("No ERP manager defined for ERPName: " + ERPName);
            }
        }
        ERP.InitERPName = InitERPName;
        /**
         * Returns the ERP name serialized on record either in Data field "ERP__" if exists or in Variable "ERP"
            * @returns {string}
            * @param {string} [parameterInstance=] Name of the parameters instance to use to read the ERP value (optional).
            */
        function GetERPName(parametersInstance) {
            return Data.GetValue("ERP__") || this.GetConfigurationERP(parametersInstance);
        }
        ERP.GetERPName = GetERPName;
        /**
         * Returns true if the ERP name serialized on record is SAP
            * @returns {boolean}
            * @param {string} [parameterInstance=] Name of the parameters instance to use to read the ERP value (optional).
            */
        function IsSAP(parametersInstance) {
            return Lib.ERP.GetERPName(parametersInstance) === "SAP";
        }
        ERP.IsSAP = IsSAP;
        /**
         * @param {string} [funcName=] Name of the function to execute.
         * @param {string} [docType=] Type of the document for which the function will be executed. "PO" or "GR".
        **/
        function ExecuteERPFunc(funcName, docType) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var error;
            var ERPName = Lib.ERP.GetERPName();
            Log.Info("Execute function " + funcName + " for document " + docType + " in ERP " + ERPName);
            var erpMgr = Lib.ERP.CreateManager(ERPName);
            // extend base definition properties
            erpMgr.ExtendDefinition({
                createDocInERP: Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("CreateDocInERP"),
                OnError: function (msg) {
                    Log.Info("Error: " + msg);
                    error = Sys.Helpers.IsEmpty(error) ? msg : error + "\n" + msg;
                }
            });
            // definition for fields mapping
            erpMgr.ExtendDefinition(Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("ERPMapping")[docType]);
            var ret = false;
            if (erpMgr.Init()) {
                var erpDocument = erpMgr.GetDocument(docType);
                ret = erpDocument[funcName].apply(erpDocument, args);
            }
            erpMgr.Finalize();
            return { ret: ret, error: error };
        }
        ERP.ExecuteERPFunc = ExecuteERPFunc;
        /**
         * Returns true if the procurement documents are created in ERP
            * @returns {boolean}
            */
        function IsDocCreatedInERP() {
            var erpName = Lib.ERP.GetERPName();
            if (erpName && erpName !== "generic") {
                var createDocInERP = Sys.Parameters.GetInstance("P2P_" + erpName).GetParameter("CreateDocInERP");
                return !!createDocInERP;
            }
            return false;
        }
        ERP.IsDocCreatedInERP = IsDocCreatedInERP;
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
