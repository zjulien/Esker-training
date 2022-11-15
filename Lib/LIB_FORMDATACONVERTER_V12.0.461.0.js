/* LIB_DEFINITION{
  "name": "Lib_FormDataConverter_V12.0.461.0",
  "require": []
}*/
var Lib;
(function (Lib) {
    var FormDataConverter;
    (function (FormDataConverter) {
        // Converter handler
        FormDataConverter.Converters = {};
        FormDataConverter.ActiveConverter = "";
        // Enum for end of line formats
        FormDataConverter.EOL = {
            Unspecified: -1,
            Unix: 0,
            Windows: 1
        };
        function Register(name, converter, isActive) {
            if (name && converter) {
                FormDataConverter.Converters[name] = converter;
                if (isActive) {
                    Lib.FormDataConverter.SetActiveConverter(name);
                }
            }
        }
        FormDataConverter.Register = Register;
        function SetActiveConverter(name) {
            if (name && FormDataConverter.Converters[name]) {
                FormDataConverter.ActiveConverter = name;
                return true;
            }
            else {
                FormDataConverter.ActiveConverter = "";
                Log.Error("FormDataConverter.SetActiveConverter: Unknown converter '" + name + "'");
                return false;
            }
        }
        FormDataConverter.SetActiveConverter = SetActiveConverter;
        function GetConverter(name) {
            if (name && FormDataConverter.Converters[name]) {
                return FormDataConverter.Converters[name];
            }
            Log.Error("FormDataConverter.GetConverter: Unknown converter '" + name + "'");
            return null;
        }
        FormDataConverter.GetConverter = GetConverter;
        // interface: all converters should implement the following methods
        /**
        * Returns the extension of the generated file
        * @returns {string} The extension of the generated file
        **/
        function GetExtension() {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                return FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetExtension();
            }
            Log.Error("FormDataConverter.GetExtension: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.GetExtension = GetExtension;
        /**
        * Returns the encoding of the generated file
        * @returns {string} The encoding of the generated file
        **/
        function GetEncoding() {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                return FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetEncoding();
            }
            Log.Error("FormDataConverter.GetEncoding: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.GetEncoding = GetEncoding;
        /**
        * Returns the end of line format of the generated file
        * @returns {int} The format of the end of line (0 for Unix, 1 for Windows)
        **/
        function GetEOLFormat() {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                if (FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetEOLFormat) {
                    return FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetEOLFormat();
                }
                else {
                    return Lib.FormDataConverter.EOL.Unspecified;
                }
            }
            Log.Error("FormDataConverter.GetEncoding: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.GetEOLFormat = GetEOLFormat;
        /**
        * Returns the Header of the file (The header will be written first in the file)
        * @returns {string} The header of the file
        **/
        function GetHeader() {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                return FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetHeader();
            }
            Log.Error("FormDataConverter.GetHeader: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.GetHeader = GetHeader;
        /**
        * Converts the dataSrc into a string to be written in the result file (after the header, and before the footer)
        * @param {object} dataSrc The Data object of the document to convert
        * @returns {string} A string containing the converted data
        **/
        function Convert(dataSrc) {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                return FormDataConverter.Converters[FormDataConverter.ActiveConverter].Convert(dataSrc);
            }
            Log.Error("FormDataConverter.Convert: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.Convert = Convert;
        /**
        * Returns the footer of the file (the footer will be appended at the end of the file)
        * (Optional in the converter)
        * @returns {string} The footer of the file
        **/
        function GetFooter() {
            if (FormDataConverter.ActiveConverter && FormDataConverter.Converters[FormDataConverter.ActiveConverter]) {
                if (FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetFooter) {
                    return FormDataConverter.Converters[FormDataConverter.ActiveConverter].GetFooter();
                }
                else {
                    return "";
                }
            }
            Log.Error("FormDataConverter.GetFooter: no converter chosen. Use SetActiveConverter");
            return null;
        }
        FormDataConverter.GetFooter = GetFooter;
    })(FormDataConverter = Lib.FormDataConverter || (Lib.FormDataConverter = {}));
})(Lib || (Lib = {}));
