/* LIB_DEFINITION{
  "name": "Lib_DD_V12.0.461.0",
  "require": []
}*/
///#GLOBALS FACeCancellationMapping
/**
 * helpers for DD package
 * @namespace Lib.DD.Helpers
 */
var Lib;
(function (Lib) {
    /**
     * @lends Lib.DD.Helpers
     */
    var DD;
    (function (DD) {
        /**
        * Parses user options and get the key-value couples as an object
        *
        * @param {string} optionsString: user options serialized in "Options" field of a user
        * @return {object} an object in which each property stands for an option key and the corresponding value (object.key=value;)
        */
        function GetUserOptions(optionsString) {
            var result = {};
            if (optionsString) {
                var options = optionsString.split(/[\n\r(\r\n)|]/);
                for (var index = 0; index < options.length; index++) {
                    var equalIndex = options[index].indexOf('=');
                    if (equalIndex === -1) {
                        Log.Warn("Invalid recipient option \"" + options[index] + "\"");
                    }
                    else {
                        var optionKey = options[index].substring(0, equalIndex);
                        var optionValue = options[index].substring(equalIndex + 1);
                        if (optionKey in result) {
                            Log.Warn("Ignoring duplicated recipient option \"" + optionKey + "\" (with value \"" + optionValue + "\")");
                        }
                        else {
                            result[optionKey.toLowerCase()] = optionValue;
                        }
                    }
                }
            }
            return result;
        }
        DD.GetUserOptions = GetUserOptions;
        /**
         *  Describes supported documents formats
         */
        DD.DocumentFormats = {
            tolerance: 1,
            formats: {
                A4: {
                    width: 210,
                    height: 297
                },
                Letter: {
                    width: 215,
                    height: 279
                }
            }
        };
        /**
        * Indicates if the document has to be resized for the destination MOD provider according to its dimensions.
        *
        * @param {string} DestModProvider: destination MOD provider
        * @param {float} docWidth: document width
        * @param {float} docHeight: document height
        * @param {float} docResX: document X resolution
        * @param {float} docResY: document Y resolution
        */
        function DocumentHasToBeResized(DestModProvider, docWidth, docHeight, docResX, docResY) {
            var mfpFormat = DestModProvider.length >= 2 && DestModProvider.substr(0, 2).toUpperCase() === "US" ? "Letter" : "A4";
            var docWidthCm = parseFloat(docWidth) * 25.4 / parseFloat(docResX);
            var docHeightCm = parseFloat(docHeight) * 25.4 / parseFloat(docResY);
            var widthRef = this.DocumentFormats.formats[mfpFormat].width;
            var heightRef = this.DocumentFormats.formats[mfpFormat].height;
            return !((widthRef - this.DocumentFormats.tolerance <= docWidthCm) && (docWidthCm <= widthRef + this.DocumentFormats.tolerance) &&
                (heightRef - this.DocumentFormats.tolerance <= docHeightCm) && (docHeightCm <= heightRef + this.DocumentFormats.tolerance));
        }
        DD.DocumentHasToBeResized = DocumentHasToBeResized;
        /**
        * Indicates if the document needs a cover page for the destination MOD provider according to its culture.
        * Note: if DocumentHasToBeResized returns true the document has to wear a cover.
        *
        * @param {object} documentCulture: document culture
        * @param {object} DestModProvider: destination MOD provider
        */
        function DocumentNeedsACoverPage(documentCulture, DestModProvider) {
            var docCulture = documentCulture.toLowerCase();
            if (docCulture === "fr-fr" || docCulture === "en-gb") {
                return ["FR", "IN", "PA"].indexOf(DestModProvider.substr(0, 2).toUpperCase()) < 0;
            }
            else if (docCulture === "en-us") {
                return DestModProvider.substr(0, 2).toUpperCase() !== "US";
            }
            return false;
        }
        DD.DocumentNeedsACoverPage = DocumentNeedsACoverPage;
        /**
        * Attachs a PDFCommand on a transport to resize it on Letter format if US or A4 format else.
        * If a PDFCommand already exists on the transport the new one will be concatenated at the end.
        *
        * @param {object} transportVars: transport to add the command
        * @param {string} DestModProvider: destination MOD provider
        */
        function ResizeDocument(transportVars, DestModProvider, documentAttachIndex) {
            var iDocumentAttachIndex = documentAttachIndex || 0;
            // Reading the current command if it exists
            var pdfCommand = transportVars.GetValue_String("PDFCommands", 0);
            pdfCommand = pdfCommand ? pdfCommand + "\n" : "";
            var paperFormat = DestModProvider.length >= 2 && DestModProvider.substr(0, 2).toUpperCase() === "US" ? "LETTER" : "A4";
            if (transportVars) {
                pdfCommand += "-resize %infile[" + (iDocumentAttachIndex + 1) + "]% ALL -stretch -center " + paperFormat;
                transportVars.AddValue_String("PDFCommands", pdfCommand, true);
            }
        }
        DD.ResizeDocument = ResizeDocument;
        function CreateCallbackParametersUsers(senderOptions, recipientOptions) {
            return {
                GetSenderUser: function () {
                    if (!senderOptions.internalUser) {
                        Log.Info("Load sender because not cached");
                        senderOptions.internalUser = Users.GetUserAsProcessAdmin(senderOptions.ownerID);
                    }
                    return senderOptions.internalUser;
                },
                GetRecipientUser: function () {
                    if (!recipientOptions.internalUser) {
                        Log.Info("Load recipient because not cached");
                        recipientOptions.internalUser = Users.GetUserAsProcessAdmin(recipientOptions.ownerID);
                    }
                    return recipientOptions.internalUser;
                }
            };
        }
        DD.CreateCallbackParametersUsers = CreateCallbackParametersUsers;
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
