///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_FirstTimeRecognition_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var FirstTimeRecognition;
    (function (FirstTimeRecognition) {
        var InvoiceDocument = /** @class */ (function () {
            function InvoiceDocument() {
            }
            return InvoiceDocument;
        }());
        FirstTimeRecognition.InvoiceDocument = InvoiceDocument;
        // Engine handler
        FirstTimeRecognition.RecognitionEngines = {};
        FirstTimeRecognition.DefaultEngine = "";
        function Register(name, engine, isDefault) {
            if (name && engine) {
                this.RecognitionEngines[name] = engine;
                if (isDefault) {
                    this.SetDefaultEngine(name);
                }
            }
        }
        FirstTimeRecognition.Register = Register;
        function SetDefaultEngine(name) {
            if (this.RecognitionEngines[name]) {
                this.DefaultEngine = name;
            }
            else {
                Log.Error("FirstTimeRecognition.SetDefaultEngine: Unknown engine '" + name + "'");
            }
        }
        FirstTimeRecognition.SetDefaultEngine = SetDefaultEngine;
        function GetEngine(name) {
            if (name && this.RecognitionEngines[name]) {
                return this.RecognitionEngines[name];
            }
            else if (this.DefaultEngine) {
                return this.RecognitionEngines[this.DefaultEngine];
            }
            return null;
        }
        FirstTimeRecognition.GetEngine = GetEngine;
        // interface: all engines should implement the following methods
        function ActivateLog(activate) {
            if (this.DefaultEngine && this.RecognitionEngines[this.DefaultEngine]) {
                this.RecognitionEngines[this.DefaultEngine].ActivateLog(activate);
                return;
            }
            Log.Error("FirstTimeRecognition.ActivateLog: Default engine is not defined. Use SetDefaultEngine");
        }
        FirstTimeRecognition.ActivateLog = ActivateLog;
        function GetNewDocument() {
            if (this.DefaultEngine && this.RecognitionEngines[this.DefaultEngine]) {
                return this.RecognitionEngines[this.DefaultEngine].GetNewDocument();
            }
            Log.Error("FirstTimeRecognition.GetNewDocument: Default engine is not defined. Use SetDefaultEngine");
            return null;
        }
        FirstTimeRecognition.GetNewDocument = GetNewDocument;
    })(FirstTimeRecognition = Lib.FirstTimeRecognition || (Lib.FirstTimeRecognition = {}));
})(Lib || (Lib = {}));
