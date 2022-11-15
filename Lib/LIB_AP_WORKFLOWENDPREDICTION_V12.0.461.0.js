/* LIB_DEFINITION{
  "name": "Lib_AP_WorkflowEndPrediction_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: helpers for the prediction of the workflow end date",
  "require": [
    "Sys/Sys_ML_WorkflowEndPredictionForAP",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_ProcessDefinition",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_GenericAPI_Server",
    "Sys/Sys_WorkflowController"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * @namespace Lib.AP.WorkflowEndPrediction
        */
        var WorkflowEndPrediction;
        (function (WorkflowEndPrediction) {
            //Parameters
            var maxRecordsByApprover = 50;
            //Form information
            var approverTableData = null;
            var hoursOfProcessing;
            var submitDateTime = Data.GetValue("SubmitDateTime");
            var companyCode = Data.GetValue("CompanyCode__");
            var vendorNumber = Data.GetValue("VendorNumber__");
            var invoiceType = Data.GetValue("InvoiceType__");
            var companyCodeFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", "")).toString();
            var vendorInvoiceTypeFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("InvoiceType__", invoiceType)).toString();
            var today = new Date();
            /**
            * Determine the CDL APPROVERSLIST__ information, to query this table later
            * @memberof Lib.AP.WorkflowEndPrediction
            */
            function initApproverTableData() {
                var processId = Process.GetProcessID();
                if (!processId) {
                    Log.Warn("initApproverTableData fails to retrieve processID from name the name Vendor invoice");
                    return false;
                }
                var tables = Sys.Helpers.ProcessDefinition.getTablesDefinitionFromProcessIDs({ processIDS: [processId] });
                if (!tables || !tables[processId] || !tables[processId].exists) {
                    Log.Warn("initApproverTableData fail to retrieve tables from processID ".concat(processId));
                    return false;
                }
                for (var _i = 0, _a = tables[processId].records; _i < _a.length; _i++) {
                    var record = _a[_i];
                    if ("APPROVERSLIST__" === record.DATA.toUpperCase()) {
                        approverTableData = {
                            "processId": processId,
                            "tableId": record.ID
                        };
                        return true;
                    }
                }
                Log.Warn("Table ApproversList__ not found in process ".concat(processId, " definition"));
                return false;
            }
            /**
            * Determine the average processing time for one approver, from the previous validated invoices
            * @memberof Lib.AP.WorkflowEndPrediction
            * @param {string} approverID approver ID.
            * @returns {number} the average number of day to approve a vendor invoice form.
            */
            function GetApproversAvgTime(approverID) {
                var averageApproverTime = 0;
                var approverTabledataInitiate = approverTableData ? true : initApproverTableData();
                function AverageTimeCalculus(result, error) {
                    if (!error) {
                        var sumDuration = 0;
                        var nbInvoiceApproved = 0;
                        for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                            var invoice = result_1[_i];
                            var startingDateTime = invoice.Line_ApprovalRequestDate__;
                            var endingDateTime = invoice.Line_ApprovalDate__;
                            if (startingDateTime && endingDateTime) {
                                var d1 = Sys.Helpers.Date.ISOSTringToDate(startingDateTime);
                                var d2 = Sys.Helpers.Date.ISOSTringToDate(endingDateTime);
                                var duration = Math.abs((d2.getTime() - d1.getTime()) / (1400 * 3600));
                                sumDuration = sumDuration + duration;
                                nbInvoiceApproved++;
                            }
                        }
                        if (nbInvoiceApproved > 0) {
                            averageApproverTime = sumDuration / nbInvoiceApproved;
                        }
                    }
                    else {
                        Log.Warn("GetApproversAvgTime function - Error during query : ".concat(error));
                    }
                }
                if (approverTabledataInitiate) {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CUSTOMDATAID", approverTableData.processId), Sys.Helpers.LdapUtil.FilterEqual("Line_ApprovalDate__", "*"), Sys.Helpers.LdapUtil.FilterEqual("Line_ApproverID__", approverID)).toString();
                    Sys.GenericAPI.Query("CDL#" + approverTableData.tableId, filter, ["Line_ApproverID__", "Line_ApprovalRequestDate__", "Line_ApprovalDate__"], AverageTimeCalculus, "Line_ApprovalRequestDate__ DESC", maxRecordsByApprover);
                }
                return averageApproverTime;
            }
            /**
            * Retrieve statistics assocated to the company code record and sort the invoice processing time by month (first month on table is the current month)
            * @memberof Lib.AP.WorkflowEndPrediction
            * @returns {number[]} the list of invoice processing time by month sorted by submitted month
            */
            function retrieveCompanyCodeStatistics() {
                var sortedStatistics;
                Sys.GenericAPI.Query("P2P - Statistics__", companyCodeFilter, ["CompanyCode__", "VendorNumber__", "InvoiceType__", "AvgProcessingTimeByMonth__"], function callback(result, error) {
                    if (!error) {
                        if (result && result.length > 0) {
                            var predictionTime = null;
                            if (result[0].AvgProcessingTimeByMonth__) {
                                try {
                                    predictionTime = JSON.parse(result[0].AvgProcessingTimeByMonth__);
                                    if (predictionTime) {
                                        sortedStatistics = [];
                                        var currentMonth = today.getMonth();
                                        if (predictionTime.currentMonth.nbInvoices > 100 ||
                                            (predictionTime.month[currentMonth].nbInvoices > 0 && predictionTime.currentMonth.nbInvoices > predictionTime.month[currentMonth].nbInvoices)) {
                                            sortedStatistics.push(predictionTime.currentMonth.averageInvoiceProcessingTime * 5 / 7);
                                        }
                                        else {
                                            sortedStatistics.push(predictionTime.month[currentMonth].averageInvoiceProcessingTime * 5 / 7);
                                        }
                                        for (var m = 11; m > 0; m--) {
                                            sortedStatistics.push(predictionTime.month[(m + currentMonth) % 12].averageInvoiceProcessingTime * 5 / 7);
                                        }
                                    }
                                }
                                catch (err) {
                                    Log.Error("Cannot parse AvgProcessingTimeByMonth__ from the record. Error : " + err);
                                }
                            }
                        }
                    }
                    else {
                        Log.Warn("Error during query on 'P2P - Statistics__' table: ".concat(error));
                    }
                }, "", 1);
                return sortedStatistics;
            }
            /**
            * Retrieve statistics assocated to the vendor record and sort the invoice processing time by month (first month on table is the current month)
            * @memberof Lib.AP.WorkflowEndPrediction
            * @returns {number[]} the invoice processing time average
            */
            function retrieveVendorStatistics() {
                var avgStatistics = null;
                Sys.GenericAPI.Query("P2P - Statistics__", vendorInvoiceTypeFilter, ["CompanyCode__", "VendorNumber__", "InvoiceType__", "AvgProcessingTimeByMonth__"], function callback(result, error) {
                    if (!error) {
                        if (result && result.length > 0) {
                            var predictionTime = null;
                            if (result[0].AvgProcessingTimeByMonth__) {
                                try {
                                    predictionTime = JSON.parse(result[0].AvgProcessingTimeByMonth__);
                                    if (predictionTime) {
                                        var currentMonth = today.getMonth();
                                        avgStatistics = 0;
                                        var nonNullMonths = 0;
                                        if (predictionTime.currentMonth.nbInvoices > 0) {
                                            avgStatistics = predictionTime.currentMonth.averageInvoiceProcessingTime;
                                            nonNullMonths++;
                                        }
                                        for (var m = 0; m < 12; m++) {
                                            var monthNbInvoices = predictionTime.month[m].nbInvoices;
                                            var monthStatistics = predictionTime.month[m].averageInvoiceProcessingTime;
                                            if (monthNbInvoices && monthNbInvoices > 0) {
                                                avgStatistics = avgStatistics + monthStatistics;
                                                nonNullMonths++;
                                            }
                                        }
                                        avgStatistics = nonNullMonths > 0 ? (avgStatistics / nonNullMonths) * 5 / 7 : null;
                                    }
                                }
                                catch (err) {
                                    Log.Error("Cannot parse AvgProcessingTimeByMonth__ from the record. Error : " + err);
                                }
                            }
                        }
                    }
                    else {
                        Log.Warn("Error during query on 'P2P - Statistics__' table: ".concat(error));
                    }
                }, "", 1);
                return avgStatistics;
            }
            /**
            * Generate new JSON containing average invoice processing time by month
            * @memberof Lib.AP.WorkflowEndPrediction
            * @param {ESKMap<string>[]} result the record with the previous statistics.
            * @returns {statisticsByMonth} the JSON with the updating statistics.
            */
            function generateJSONStatistics(result) {
                var predictionTime = null;
                if (result && result.length > 0 && result[0].AvgProcessingTimeByMonth__) {
                    try {
                        predictionTime = JSON.parse(result[0].AvgProcessingTimeByMonth__);
                    }
                    catch (err) {
                        Log.Error("Failed to parse JSON AvgProcessingTimeByMonth__: " + err);
                    }
                }
                if (!predictionTime) {
                    predictionTime = {
                        month: [],
                        currentMonth: { "averageInvoiceProcessingTime": 0, "nbInvoices": 0, "monthID": today.getMonth() }
                    };
                    for (var i = 0; i < 12; i++) {
                        predictionTime.month.push({ "averageInvoiceProcessingTime": 0, "nbInvoices": 0 });
                    }
                }
                if (predictionTime.currentMonth.monthID !== today.getMonth()) {
                    predictionTime.month[predictionTime.currentMonth.monthID] = {
                        averageInvoiceProcessingTime: predictionTime.currentMonth.averageInvoiceProcessingTime,
                        nbInvoices: predictionTime.currentMonth.nbInvoices
                    };
                    predictionTime.currentMonth = { "averageInvoiceProcessingTime": 0, "nbInvoices": 0, "monthID": today.getMonth() };
                }
                var monthOfSubmission = submitDateTime.getMonth();
                if (monthOfSubmission === predictionTime.currentMonth.monthID) {
                    var newNbInvoices = predictionTime.currentMonth.nbInvoices + 1;
                    predictionTime.currentMonth.averageInvoiceProcessingTime =
                        ((predictionTime.currentMonth.averageInvoiceProcessingTime * predictionTime.currentMonth.nbInvoices) + hoursOfProcessing) / newNbInvoices;
                    predictionTime.currentMonth.nbInvoices = newNbInvoices;
                }
                else {
                    var newNbInvoices = predictionTime.month[monthOfSubmission].nbInvoices + 1;
                    predictionTime.month[monthOfSubmission].averageInvoiceProcessingTime =
                        ((predictionTime.month[monthOfSubmission].averageInvoiceProcessingTime * predictionTime.month[monthOfSubmission].nbInvoices) + hoursOfProcessing) / newNbInvoices;
                    predictionTime.month[monthOfSubmission].nbInvoices = newNbInvoices;
                }
                return predictionTime;
            }
            /**
            * Update field invoiceProcessingTime__, containing average invoice processing time, on the CT "PurchasingCompanycodes__" for the invoice company code
            * @memberof Lib.AP.WorkflowEndPrediction
            * @param {ESKMap<string>[]} result record with the previous statistics.
            * @param {string} error error message during the CT query.
            */
            function UpdateCompanyCodeProcessingTime(result, error) {
                if (!error) {
                    var predictionTime = generateJSONStatistics(result);
                    Sys.Helpers.Database.AddOrModifyTableRecord("P2P - Statistics__", companyCodeFilter, [{ "name": "AvgProcessingTimeByMonth__", "value": JSON.stringify(predictionTime) },
                        { "name": "CompanyCode__", "value": companyCode, "addOnly": true },
                        { "name": "VendorNumber__", "value": "", "addOnly": true },
                        { "name": "InvoiceType__", "value": "", "addOnly": true }
                    ]);
                }
                else {
                    Log.Warn("Error during query on 'P2P - Statistics__' table: ".concat(error));
                }
            }
            /**
            * Update field invoiceProcessingTime__, containing average invoice processing time, on the CT "AP - Vendors__" for the invoice vendor
            * @memberof Lib.AP.WorkflowEndPrediction
            * @param {ESKMap<string>[]} result record with the previous statistics.
            * @param {string} error error message during the CT query.
            */
            function UpdateVendorProcessingTime(result, error) {
                if (!error) {
                    var predictionTime = generateJSONStatistics(result);
                    Sys.Helpers.Database.AddOrModifyTableRecord("P2P - Statistics__", vendorInvoiceTypeFilter, [{ "name": "AvgProcessingTimeByMonth__", "value": JSON.stringify(predictionTime) },
                        { "name": "CompanyCode__", "value": companyCode, "addOnly": true },
                        { "name": "VendorNumber__", "value": vendorNumber, "addOnly": true },
                        { "name": "InvoiceType__", "value": invoiceType, "addOnly": true }
                    ]);
                }
                else {
                    Log.Warn("Error during query on 'P2P - Statistics__' table: ".concat(error));
                }
            }
            /**
            * Updates the average processing time for the invoice company code and vendor on CTs
            * @memberof Lib.AP.WorkflowEndPrediction
            */
            function UpdateMasterDataStatistic() {
                if (submitDateTime && companyCode && vendorNumber) {
                    hoursOfProcessing = Math.round(Math.abs((today.getTime() - submitDateTime.getTime()) / (1000 * 3600)) * 1000) / 1000;
                    Log.Info("Number of treatment hours: ".concat(hoursOfProcessing));
                    Sys.GenericAPI.Query("P2P - Statistics__", companyCodeFilter, ["CompanyCode__", "VendorNumber__", "InvoiceType__", "AvgProcessingTimeByMonth__"], UpdateCompanyCodeProcessingTime, "", 1);
                    Sys.GenericAPI.Query("P2P - Statistics__", vendorInvoiceTypeFilter, ["CompanyCode__", "VendorNumber__", "InvoiceType__", "AvgProcessingTimeByMonth__"], UpdateVendorProcessingTime, "", 1);
                }
            }
            WorkflowEndPrediction.UpdateMasterDataStatistic = UpdateMasterDataStatistic;
            /**
            * Return the prediction date of the end of the workflow of the current invoice
            * @memberof Lib.AP.WorkflowEndPrediction
            * @param {function} callback to process the prediction date and the error message.
            */
            function Prediction(callback) {
                if (companyCode && vendorNumber) {
                    var JSONForModel = {
                        companyCodeData: retrieveCompanyCodeStatistics(),
                        vendorData: retrieveVendorStatistics(),
                        approversSum: -1,
                        currentApproverIndex: 0,
                        maxApproverIndex: 0
                    };
                    var errorMessage = null;
                    //Retrieve the approvers data from the 'Approvers List'
                    var approversList = Data.GetTable("ApproversList__");
                    JSONForModel.maxApproverIndex = approversList.GetItemCount();
                    var sumApprobationTime = 0;
                    var nbApproversValidated = 0;
                    var nbApproverWithNoData = 0;
                    var nbApproverWithNoDate = 0;
                    var lastApprovalDate = submitDateTime;
                    for (var i = 0; i < JSONForModel.maxApproverIndex; i++) {
                        var line = approversList.GetItem(i);
                        var approvalDate = line.GetValue("ApprovalDate__");
                        if (approvalDate) {
                            if (lastApprovalDate.getTime() < approvalDate.getTime()) {
                                lastApprovalDate = approvalDate;
                            }
                            nbApproversValidated++;
                        }
                        else if (line.GetValue("ApproverID__")) {
                            var approversAvgTime = GetApproversAvgTime(line.GetValue("ApproverID__"));
                            if (approversAvgTime > 0) {
                                sumApprobationTime = sumApprobationTime + approversAvgTime;
                            }
                            else {
                                nbApproverWithNoDate++;
                            }
                        }
                        else {
                            nbApproverWithNoData++;
                        }
                    }
                    if (nbApproverWithNoData === 0 && nbApproverWithNoDate === 0) {
                        JSONForModel.currentApproverIndex = nbApproversValidated;
                        JSONForModel.approversSum = sumApprobationTime;
                        var predictionByHour = 0;
                        if (JSONForModel.companyCodeData && JSONForModel.vendorData) {
                            try {
                                predictionByHour = Sys.ML.WorkflowEndPredictionForAP.Predict(JSONForModel);
                            }
                            catch (err) {
                                Log.Error("Failed to call prediction neural network: " + err);
                            }
                        }
                        if (!predictionByHour || predictionByHour <= 0) {
                            Log.Warn("The worflow end date is equal to the sum of the remaining approbation time");
                            predictionByHour = sumApprobationTime;
                        }
                        var predictionDate = new Date(today.getTime() + (predictionByHour * 1000 * 3600));
                        Log.Info("Prediction of the workflow end date: " + predictionDate);
                        callback({ "endProcessingDate": Sys.Helpers.Date.Date2DBDateTime(predictionDate) }, errorMessage);
                    }
                    else {
                        callback(null, "Cannot predict workflow end date - not enought appover data");
                    }
                }
                else {
                    callback(null, "Cannot predict workflow end date - not enought form header data");
                }
            }
            WorkflowEndPrediction.Prediction = Prediction;
        })(WorkflowEndPrediction = AP.WorkflowEndPrediction || (AP.WorkflowEndPrediction = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
