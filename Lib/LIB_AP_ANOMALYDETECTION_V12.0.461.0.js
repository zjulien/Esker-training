///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_ANOMALYDETECTION_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP library",
  "require": [
    "Sys/Sys_Helpers_Data",
    "Sys/SYS_OUTLIER_DETECTION"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var AnomalyDetection;
        (function (AnomalyDetection) {
            function DetectUnusualInvoiceAmount() {
                if (Sys.Parameters.GetInstance("AP").GetParameter("AnomalyDetectionForAP", "0") === "1") {
                    var localInvoiceAmount = Data.GetValue("LocalInvoiceAmount__");
                    if (localInvoiceAmount) {
                        var datasetFilter = "(&(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(VendorNumber__=" + Data.GetValue("VendorNumber__") + ")(State=100))";
                        var dataset = Process.BuildTrainingDataset("CD#" + Process.GetProcessID("Vendor Invoice"), datasetFilter, ["LocalInvoiceAmount__"]);
                        if (dataset.length === 0) {
                            Log.Warn("No dataset returned by 'Process.BuildTrainingDataset' -> no detection of unusual invoice amount");
                            return;
                        }
                        var result = Sys.OutlierDetection.IsOutlierValue(dataset, localInvoiceAmount);
                        if (result.error) {
                            Log.Error(result.error);
                        }
                        else if (result.status) {
                            Sys.Helpers.Data.AddWarning("InvoiceAmount__", "_UnusualInvoiceAmount");
                            Sys.Helpers.Data.AddWarning("NetAmount__", "_UnusualInvoiceAmount");
                        }
                        else if (result.warning) {
                            Log.Warn(result.warning);
                        }
                    }
                }
            }
            AnomalyDetection.DetectUnusualInvoiceAmount = DetectUnusualInvoiceAmount;
            function OnChangeRefreshAnomaly() {
                if (Sys.Parameters.GetInstance("AP").GetParameter("AnomalyDetectionForAP", "0") === "1") {
                    Sys.Helpers.Data.RemoveSpecificWarning("InvoiceAmount__", "_UnusualInvoiceAmount");
                    Sys.Helpers.Data.RemoveSpecificWarning("NetAmount__", "_UnusualInvoiceAmount");
                    Variable.SetValueAsString("NeedNewAnomalyDetection", "true");
                }
            }
            AnomalyDetection.OnChangeRefreshAnomaly = OnChangeRefreshAnomaly;
            function CheckIfNewAnomalyDetectionIsNeeded() {
                if (Variable.GetValueAsString("NeedNewAnomalyDetection") === "true") {
                    Lib.AP.AnomalyDetection.DetectUnusualInvoiceAmount();
                }
            }
            AnomalyDetection.CheckIfNewAnomalyDetectionIsNeeded = CheckIfNewAnomalyDetectionIsNeeded;
        })(AnomalyDetection = AP.AnomalyDetection || (AP.AnomalyDetection = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
