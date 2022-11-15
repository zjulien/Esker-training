///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_CallScheduledAction_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server library used to call a specific action on a document",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_CSVReader",
    "Lib_V12.0.461.0",
    "Lib_AP_V12.0.461.0",
    "[Lib_AP_Customization_CallScheduledAction]"
  ]
}*/
var Lib;
(function (Lib) {
    var CallScheduledAction;
    (function (CallScheduledAction) {
        /**
         * @namespace Lib.CallScheduledAction
         */
        /**
         * Define the information about an action to execute
         * @typedef {Object} ScheduledAction
         * @property {string} msnEx
         * @property {string} actionName
         * @property {string|string[]} parameters
         * @memberof Lib.CallScheduledAction
         */
        /**
         * Read the line of the CSV and create the scheduledAction matching object
         * @param {Sys.Helpers.CSVReader.CSVReader2} csvHelper The CSVReader object used to read the CSV
         * @param  {string[]} lineArray One line from the CSV to parse
         * @return {Lib.CallScheduledAction.ScheduledAction} The information about the ScheduledAction to execute or null if line is empty
         */
        function extractLineInformations(csvReader, lineArray) {
            var result = new ScheduledAction();
            if (!lineArray || !Array.isArray(lineArray)) {
                return null;
            }
            result.msnEx = lineArray[0];
            result.actionName = lineArray[1];
            if (lineArray.length && lineArray.length > 2) {
                result.parameters = getParametersFromLine(csvReader, lineArray);
            }
            result.reopened = false;
            result.tries = 1;
            Log.Verbose("extractLineInformations " + JSON.stringify(result));
            return result;
        }
        /**
         * Create an object from the values of all the columns of the CSV file
         * @param {Sys.Helpers.CSVReader.CSVReader2} csvHelper The CSVReader object used to read the CSV
         * @param {string[]} lineArray The current line array of the CSV
         */
        function getParametersFromLine(csvReader, lineArray) {
            if (!lineArray.length || lineArray.length <= 2) {
                return null;
            }
            var parameters = {};
            for (var i = 2; i < lineArray.length; i++) {
                parameters[csvReader.GetHeaderName(i)] = lineArray[i];
            }
            return parameters;
        }
        /**
         * If the previous and the current action concerned the same MSNEX and Action,
         * the parameters are merged
         * @param {Lib.CallScheduledAction.ScheduledAction} first
         * @param {Lib.CallScheduledAction.ScheduledAction} second
         * @return {Lib.CallScheduledAction.ScheduledAction} A new ScheduledAction with the first and the second actions merged into
         */
        function mergeScheduledAction(first, second) {
            var action = new ScheduledAction();
            action.msnEx = first.msnEx;
            action.actionName = first.actionName;
            action.parameters = [];
            if (first.parameters) {
                action.parameters = action.parameters.concat(first.parameters);
            }
            if (second.parameters) {
                action.parameters = action.parameters.concat(second.parameters);
            }
            return action;
        }
        /**
         * Indicate if two ScheduledAction matched
         * @param {Lib.CallScheduledAction.ScheduledAction} first
         * @param {Lib.CallScheduledAction.ScheduledAction} second
         * @return {boolean} True is they matched else false
         */
        function isScheduledActionMatched(first, second) {
            if (first === null || second === null) {
                return false;
            }
            if (first.msnEx !== second.msnEx) {
                return false;
            }
            if (first.actionName !== second.actionName) {
                return false;
            }
            return true;
        }
        CallScheduledAction.csvHelper = null;
        /**
         * default mapping used to inhibit the call of the process actions
         * This mapping can be overloaded by the user exit Lib.AP.Customization.CallScheduledAction.GetIsActionCallableMapping
         */
        CallScheduledAction.defaultActionMapping = {
            "UpdateHolds": HoldsUpdateNeeded
        };
        /**
         * If parameters exists, add them in the ScheduledActionParameters external variable
         * @param {object} scheduledAction the scheduled action that will be executed
         * @param {object} trn The current record on which the action will be executed
         */
        function addParametersAsExternalVariable(scheduledAction, trn) {
            if (scheduledAction.parameters) {
                var externalVariables = trn.GetExternalVars();
                externalVariables.AddValue_String("ScheduledActionParameters", JSON.stringify(scheduledAction.parameters), true);
            }
        }
        function isValidState(state, scheduledAction) {
            if (state < 100) {
                return true;
            }
            if (state >= 100 && !scheduledAction.reopened && scheduledAction.tries === 1) {
                return true;
            }
            return false;
        }
        CallScheduledAction.isValidState = isValidState;
        function isActionState(state, scheduledAction) {
            if (state === 70 || state === 90 || (state >= 100 && !scheduledAction.reopened && scheduledAction.tries === 1)) {
                return true;
            }
            return false;
        }
        CallScheduledAction.isActionState = isActionState;
        /**
         * Call the appropriate function on the record to execute the action
         *
         */
        function executeAction(vars, scheduledAction, trn, takeOwnership) {
            if (takeOwnership === void 0) { takeOwnership = false; }
            var state = vars.GetValue_Long("State", 0);
            if (!Lib.CallScheduledAction.isValidState(state, scheduledAction)) {
                Log.Error("Record " + scheduledAction.msnEx + ", state " + state + " is not longer in a valid state stop retrying to execute action.");
                return true; // end retrying
            }
            if (!Lib.CallScheduledAction.isActionState(state, scheduledAction)) {
                Log.Info("Record " + scheduledAction.msnEx + ", state " + state + " is not in action callable state, put the record in queue to retry later.");
                return false; // retry
            }
            if (state >= 100 && !scheduledAction.reopened) {
                // Form is in state 100 and was never reopened
                // We don't call the action directly by returning update=false
                // The next retry state should be 70 and the action should be executed
                trn.Reopen();
                scheduledAction.reopened = true;
                Log.Verbose("Reopen record " + scheduledAction.msnEx);
                return false; // retry
            }
            addParametersAsExternalVariable(scheduledAction, trn);
            var actionreturnCode = false;
            var action = "<empty>";
            if (state === 70) {
                action = "Validate";
                var ownership = void 0, ownershipToken = void 0;
                if (takeOwnership) {
                    ownershipToken = "ScheduleActionToken_" + vars.GetValue_String("RuidEx", 0);
                    ownership = trn.GetAsyncOwnership(ownershipToken, 20000);
                }
                vars.AddValue_String("RequestedActions", "approve|" + scheduledAction.actionName, true);
                vars.AddValue_String("NeedValidation", "0", true);
                actionreturnCode = !!trn.Validate("Call scheduled action " + scheduledAction.actionName);
                if (takeOwnership && ownership) {
                    trn.ReleaseAsyncOwnership(ownershipToken);
                }
            }
            else if (state === 90) {
                action = "ResumeWithAction";
                actionreturnCode = !!trn.ResumeWithAction(scheduledAction.actionName, false);
            }
            Log.Verbose(action + " " + scheduledAction.msnEx + ", action:" + scheduledAction.actionName + ", params: " + JSON.stringify(scheduledAction.parameters) + ", returned " + actionreturnCode + ", message: " + trn.GetLastErrorMessage());
            return actionreturnCode;
        }
        CallScheduledAction.executeAction = executeAction;
        /**
         * Constructor for the ScheduledAction object
         * @return {Lib.CallScheduledAction.ScheduledAction}
         */
        var ScheduledAction = /** @class */ (function () {
            function ScheduledAction() {
                this.msnEx = null;
                this.actionName = null;
                this.parameters = null;
                this.reopened = false;
                this.tries = 1;
            }
            return ScheduledAction;
        }());
        CallScheduledAction.ScheduledAction = ScheduledAction;
        function isActionCallable(scheduledAction) {
            var actionMapping = Sys.Helpers.TryCallFunction("Lib.AP.Customization.CallScheduledAction.GetIsActionCallableMapping", Lib.CallScheduledAction.defaultActionMapping) || Lib.CallScheduledAction.defaultActionMapping;
            if (!scheduledAction ||
                !actionMapping[scheduledAction.actionName] ||
                typeof actionMapping[scheduledAction.actionName] !== "function") {
                return true;
            }
            return actionMapping[scheduledAction.actionName](scheduledAction);
        }
        CallScheduledAction.isActionCallable = isActionCallable;
        /**
         * @param {Lib.CallScheduledAction.ScheduledAction} scheduledAction
         */
        function callActionOnDocument(scheduledAction) {
            if (!scheduledAction ||
                !Lib.CallScheduledAction.isActionCallable(scheduledAction)) {
                Log.Error("Action " + scheduledAction.actionName + " is not callable for " + scheduledAction.msnEx);
                return true;
            }
            var query = Process.CreateQueryAsProcessAdmin();
            query.SetSearchInArchive(true);
            query.SetFilter("MsnEx=" + scheduledAction.msnEx);
            query.SetOptionEx("DoNotGetLocalDBFiles=1");
            if (query.MoveFirst()) {
                var trn = query.MoveNext();
                if (trn) {
                    var vars = trn.GetVars(false);
                    // Call the requested validate action for the current transport
                    return Lib.CallScheduledAction.executeAction(vars, scheduledAction, trn);
                }
                Log.Error("The transport with identifier " + scheduledAction.msnEx + " was not found ");
                return true;
            }
            Log.Error("The record with identifier " + scheduledAction.msnEx + " was not found ");
            return true;
        }
        CallScheduledAction.callActionOnDocument = callActionOnDocument;
        function getFailedScheduledActions() {
            var failedScheduledActions = [];
            if (Variable.GetValueAsString("failedScheduledActions")) {
                try {
                    failedScheduledActions = JSON.parse(Variable.GetValueAsString("failedScheduledActions"));
                }
                catch (error) {
                    Log.Verbose("Fail to parse scheduled actions ".concat(Variable.GetValueAsString("failedScheduledActions")));
                }
            }
            return failedScheduledActions;
        }
        CallScheduledAction.getFailedScheduledActions = getFailedScheduledActions;
        function serializeFailedScheduledActions(failedScheduledActions) {
            Variable.SetValueAsString("failedScheduledActions", JSON.stringify(failedScheduledActions));
        }
        CallScheduledAction.serializeFailedScheduledActions = serializeFailedScheduledActions;
        function getNbRetries(options) {
            return options && options.maxRetriesPerRecord ? options.maxRetriesPerRecord : 10;
        }
        CallScheduledAction.getNbRetries = getNbRetries;
        function retryFailedScheduledActions(options) {
            var failedScheduledActions = getFailedScheduledActions();
            // Call the failed scheduled actions
            var nbMaxRetries = getNbRetries(options);
            for (var i = failedScheduledActions.length - 1; i >= 0; --i) {
                if (!failedScheduledActions[i].tries) {
                    failedScheduledActions[i].tries = 0;
                }
                failedScheduledActions[i].tries++;
                if (!callActionOnDocument(failedScheduledActions[i])) {
                    if (failedScheduledActions[i].tries >= nbMaxRetries) {
                        Log.Verbose("Fail to call action ".concat(JSON.stringify(failedScheduledActions[i]), " after ").concat(nbMaxRetries, " tries"));
                        failedScheduledActions.splice(i, 1);
                    }
                }
                else {
                    failedScheduledActions.splice(i, 1);
                }
            }
            return failedScheduledActions;
        }
        CallScheduledAction.retryFailedScheduledActions = retryFailedScheduledActions;
        function callActionOnDocumentsFromCSV(options) {
            if (Variable.GetValueAsString("CSVReadingEnded") !== "true") {
                /** Here we test for the existence of Lib.CallScheduledAction.csvHelper
                * But it's worth noting it will always be null because it's not kept between
                * 2 calls from the finalization script of Call Scheduled action... */
                var readerAlreadyExists = Lib.CallScheduledAction.csvHelper || Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier());
                if (readerAlreadyExists) { // Get reader that already exists
                    Lib.CallScheduledAction.csvHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
                }
                else { // Create new reader
                    Lib.CallScheduledAction.csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    Lib.CallScheduledAction.csvHelper.ReturnSeparator = "\n";
                    // read first line (Header line) and guess the separator
                    Lib.CallScheduledAction.csvHelper.GuessSeparator();
                }
            }
            /**
             * There is a case where we execute this while CSVReadingEnded is true; it is when some scripts must be retried.
             * In this case, we'll skip the csv reading part and jump straight to retryFailedScheduledActions.
             */
            var executionState = 1;
            var scheduledActions = [];
            var scheduledAction;
            var line = Lib.CallScheduledAction.csvHelper ? Lib.CallScheduledAction.csvHelper.GetNextLine() : null;
            var previousScheduledAction = Variable.GetValueAsString("previousScheduledAction") ? JSON.parse(Variable.GetValueAsString("previousScheduledAction")) : null;
            while (line !== null) {
                var lineArray = Lib.CallScheduledAction.csvHelper.GetCurrentLineArray();
                if (lineArray) {
                    scheduledAction = extractLineInformations(Lib.CallScheduledAction.csvHelper, lineArray);
                    if (isScheduledActionMatched(previousScheduledAction, scheduledAction)) {
                        scheduledAction = mergeScheduledAction(previousScheduledAction, scheduledAction);
                    }
                    else if (previousScheduledAction) {
                        scheduledActions.push(previousScheduledAction);
                    }
                    previousScheduledAction = scheduledAction;
                    if (scheduledActions.length >= options.maxElementsPerRecall) {
                        Lib.CallScheduledAction.csvHelper.SerializeCurrentState();
                        Variable.SetValueAsString("previousScheduledAction", JSON.stringify(previousScheduledAction));
                        executionState = 0;
                        break;
                    }
                }
                line = Lib.CallScheduledAction.csvHelper.GetNextLine();
            }
            // Add the latest read action to the list
            if (line === null && scheduledAction) {
                scheduledActions.push(scheduledAction);
                Variable.SetValueAsString("CSVReadingEnded", "true");
            }
            /** Retry the failed actions from last execution */
            var failedScheduledActions = retryFailedScheduledActions(options);
            /** Execute this execution's action list */
            for (var i = 0; i < scheduledActions.length; i++) {
                if (!callActionOnDocument(scheduledActions[i]) && getNbRetries(options) > 1) {
                    scheduledActions[i].tries = 1;
                    failedScheduledActions.push(scheduledActions[i]);
                }
            }
            /** Serialize the failed action from this execution so they can be retried next execution */
            serializeFailedScheduledActions(failedScheduledActions);
            if (failedScheduledActions.length > 0) {
                executionState = 0;
            }
            return executionState;
        }
        CallScheduledAction.callActionOnDocumentsFromCSV = callActionOnDocumentsFromCSV;
        function HoldsUpdateNeeded(action) {
            var processQuery = Process.CreateQuery();
            processQuery.SetSpecificTable("CDNAME#Vendor invoice");
            processQuery.SetFilter("&(state>=70)(MSNEX=".concat(action.msnEx, ")"));
            processQuery.SetSearchInArchive(true);
            processQuery.AddAttribute("ActiveHoldsCount__");
            processQuery.AddAttribute("LastHoldReleaseDate__");
            processQuery.AddAttribute("InvoiceStatus__");
            if (processQuery.MoveFirst()) {
                var transport = processQuery.MoveNext();
                if (transport) {
                    var processVars = transport.GetUninheritedVars();
                    var activeHoldsCount = parseInt(processVars.GetValue_String("ActiveHoldsCount__", 0), 10) || 0;
                    var lastHoldReleaseDate = Sys.Helpers.Date.ISOSTringToDateEx(processVars.GetValue_String("LastHoldReleaseDate__", 0)) || new Date(0);
                    var invoiceStatus = processVars.GetValue_String("InvoiceStatus__", 0);
                    if (invoiceStatus === Lib.AP.InvoiceStatus.Paid) {
                        Log.Verbose("HoldsUpdateNeeded - the record ".concat(action.msnEx, " is in paid status, skipping..."));
                        return false;
                    }
                    if (!Array.isArray(action.parameters)) {
                        action.parameters = [action.parameters];
                    }
                    var csvLastHoldReleaseDate = action.parameters
                        .map(function (line) { return Sys.Helpers.Date.ISOSTringToDateEx(line.ReleaseDate__); })
                        .sort(function (a, b) { return b - a; })[0];
                    if (activeHoldsCount > 0 && csvLastHoldReleaseDate > lastHoldReleaseDate) {
                        Log.Verbose("HoldsUpdateNeeded - Holds for the record ".concat(action.msnEx, " seems to have changed, allow update"));
                        return true;
                    }
                    Log.Verbose("HoldsUpdateNeeded - Holds for the record ".concat(action.msnEx, " looks the same, skipping..."));
                }
                else {
                    Log.Verbose("HoldsUpdateNeeded - Invoice ".concat(action.msnEx, " not found, skipping..."));
                }
            }
            // invoice not found -> ignore line
            return false;
        }
    })(CallScheduledAction = Lib.CallScheduledAction || (Lib.CallScheduledAction = {}));
})(Lib || (Lib = {}));
