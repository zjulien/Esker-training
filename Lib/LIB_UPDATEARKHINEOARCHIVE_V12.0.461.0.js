/* LIB_DEFINITION{
  "name": "Lib_UpdateArkhineoArchive_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server library used to call action on Arkhineo archives listed in ARF csv/xml file",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_CSVReader",
    "Lib_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var UpdateArkhineoArchive;
    (function (UpdateArkhineoArchive) {
        /**
         * @namespace Lib.UpdateArkhineoArchive
         */
        UpdateArkhineoArchive.csvHelper = null;
        /**
         * Read the line of the CSV and create the ArkhineoArchive object
         * @param {Sys.Helpers.CSVReader.CSVReader2} csvHelper The CSVReader object used to read the CSV
         * @param  {string[]} lineArray One line from the CSV to parse
         * @return {object} The information about the arkhineo archive or null if line is empty
         */
        function extractLineInformations(lineArray) {
            if (!lineArray || !Array.isArray(lineArray)) {
                return null;
            }
            if (lineArray.length >= 1) {
                var iua = lineArray[0];
                if (iua) {
                    return {
                        archiveUniqueIdentifier: iua
                    };
                }
            }
            return null;
        }
        function getQueryFilter(json) {
            var filter = "";
            var position = 1;
            for (var index = 0; index < json.length; index++) {
                var oneArchive = json[index];
                var subFilter = "ArchiveUniqueIdentifier__=" + oneArchive.archiveUniqueIdentifier;
                if (position === 1) {
                    filter = subFilter;
                    position++;
                }
                else if (position === 2) {
                    filter = "|(" + filter + ")(" + subFilter + ")";
                    position++;
                }
                else {
                    filter = filter + "(" + subFilter + ")";
                }
            }
            filter = "(" + filter + ")";
            return filter;
        }
        function updateArchiveProcessFromCSV(options) {
            if (!UpdateArkhineoArchive.csvHelper && !Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier())) {
                UpdateArkhineoArchive.csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                UpdateArkhineoArchive.csvHelper.ReturnSeparator = "\n";
                UpdateArkhineoArchive.csvHelper.SplitSeparator = ";";
            }
            else {
                UpdateArkhineoArchive.csvHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
            }
            var executionState = 1;
            var archiveProcessesToUpdate = [];
            var updateInformations;
            var line = UpdateArkhineoArchive.csvHelper.GetNextLine();
            while (line !== null) {
                var lineArray = UpdateArkhineoArchive.csvHelper.GetCurrentLineArray();
                if (lineArray) {
                    updateInformations = extractLineInformations(lineArray);
                    if (updateInformations && updateInformations.archiveUniqueIdentifier) {
                        archiveProcessesToUpdate.push(updateInformations);
                        if (archiveProcessesToUpdate.length >= options.maxElementsPerRecall) {
                            UpdateArkhineoArchive.csvHelper.SerializeCurrentState();
                            executionState = 0;
                            break;
                        }
                    }
                    else {
                        Log.Warn("Cannot extract Archive Unique Identifier from CSV Line");
                    }
                }
                line = UpdateArkhineoArchive.csvHelper.GetNextLine();
            }
            if (archiveProcessesToUpdate.length > 0) {
                JSONToUpdateArchiveProcess(archiveProcessesToUpdate, "Vendor invoice legal archive");
            }
            return executionState;
        }
        function JSONToUpdateArchiveProcess(archivesUpdate, processName) {
            var cntUpdated = 0;
            var cntSkipped = 0;
            var query = Process.CreateQueryAsProcessAdmin();
            query.Reset();
            query.SetSpecificTable("CDNAME#" + processName);
            query.SetSearchInArchive(true);
            query.SetFilter(getQueryFilter(archivesUpdate));
            // Parse invoices and build attachment
            if (query.MoveFirst()) {
                var transport = query.MoveNext();
                while (transport) {
                    var errorMessage = updateArchiveProcess(transport);
                    if (!errorMessage) {
                        cntUpdated++;
                    }
                    else {
                        Log.Warn(errorMessage);
                        cntSkipped++;
                    }
                    transport = query.MoveNext();
                }
            }
            Log.Info(cntUpdated + " archive(s) status updated");
            if (cntSkipped === 0) {
                return true;
            }
            return false;
        }
        function updateArchiveProcess(transport) {
            var vars = transport.GetUninheritedVars();
            if (transport.GetLastError() !== 0) {
                return transport.GetLastErrorMessage();
            }
            try {
                // Update Archiving status
                vars.AddValue_String("ArchivingStatus__", "Sealed", true);
                transport.Process();
                return null;
            }
            catch (e) {
                Log.Error("updateArchiveProcess: Archive process could not be updated: " + e);
            }
            return transport.GetLastErrorMessage();
        }
        function updateArchiveProcessFromDocument(options) {
            return updateArchiveProcessFromCSV(options);
        }
        UpdateArkhineoArchive.updateArchiveProcessFromDocument = updateArchiveProcessFromDocument;
    })(UpdateArkhineoArchive = Lib.UpdateArkhineoArchive || (Lib.UpdateArkhineoArchive = {}));
})(Lib || (Lib = {}));
