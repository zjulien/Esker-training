///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "require": [
    "Sys/Sys_Helpers",
    "Lib_V12.0.461.0"
  ],
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "name": "Lib_CommonDialog_V12.0.461.0"
}*/
/**
 * This module contains functions that displays commonly used dialogs
 * @namespace Lib.CommonDialog
*/
var Lib;
(function (Lib) {
    var CommonDialog;
    (function (CommonDialog) {
        /**
         * @callback Lib.CommonDialog.onClickOkCallBack
         * @param {object} data - the data
         * @param {string} data.reason - the select reason
         * @param {string} data.comment - the comment entered
         */
        function PopupComment(config, hasReason) {
            // Fill dialog callback: Design and instantiation of the controls
            var fillPopupCB = function (dialog) {
                if (config.helpId) {
                    dialog.SetHelpId(config.helpId);
                }
                if (config.limitDate) {
                    var limitDate = dialog.AddDate("limitDate", config.limitDate);
                    var now = new Date();
                    limitDate.SetValue(now.setDate(now.getDate() + 7));
                }
                if (hasReason) {
                    var cb_control = dialog.AddComboBox("Reason", config.reasonListLabel, 400);
                    var txtCombo = config.possibleValues;
                    if (!config.ignoreNone) {
                        // Display -- none -- in combo for empty value
                        var txtComboArray = txtCombo.split("\n");
                        for (var i = 0; i < txtComboArray.length; i++) {
                            if (txtComboArray[i].substr(txtComboArray[i].indexOf("=") + 1) === "") {
                                txtComboArray[i] += "-- none --";
                            }
                        }
                        txtCombo = txtComboArray.join("\n");
                    }
                    cb_control.SetText(txtCombo);
                    cb_control.SetValue(config.currentReason);
                }
                var history_control = dialog.AddMultilineText("Comment", "_Comment");
                history_control.SetText(config.currentComment);
                if (config.confirmationMessage) {
                    var chkConfirm = dialog.AddCheckBox("Confirm", config.confirmationMessage);
                    chkConfirm.SetValue(config.confirmationValue);
                }
            };
            // Commit dialog callback: updates the process form with dialog results
            var commitPopupCB = function (dialog) {
                var result = {
                    reason: hasReason ? dialog.GetControl("Reason").GetValue() : null,
                    comment: dialog.GetControl("Comment").GetValue(),
                    confirmationValue: null,
                    limitDate: null
                };
                if (result.reason === "-- none --") {
                    result.reason = "";
                }
                if (config.confirmationMessage) {
                    result.confirmationValue = dialog.GetControl("Confirm").GetValue();
                }
                if (config.limitDate) {
                    result.limitDate = dialog.GetControl("limitDate").GetValue();
                }
                config.onClickOk(result);
            };
            Sys.Helpers.Globals.Popup.Dialog(config.title, null, fillPopupCB, commitPopupCB);
        }
        CommonDialog.PopupComment = PopupComment;
        /**
         * Popup a dialog from which you can select a "reason" from a predefined list and enter a comment.
         * The width of the popup is forced to 400px
         * @param {object} config contains the display configuration of the box
         * @param {string} config.title - contains the title of the dialog
         * @param {number} config.helpId - contains the identifier of the documentation page (optional)
         * @param {string} config.reasonListLabel - contains the title of the reason combobox
         * @param {string} config.possibleValues - contains the list of the possible values.
         * This is a multiline string, where each line is a key=value pair (typically what is returned by a ComboBox.GetText())
         * The first item must have an empty value, which will be set to "-- none --" (which must have a translation in your form)
         * @param {string} config.currentReason - contains the current reason key (typically returned by a ComboBox.GetValue())
         * @param {string} config.currentComment - contains the current comment text
         * @param {Lib.CommonDialog.onClickOkCallBack} config.onClickOk - the callback that handles the response when the user selects an item
         *
         * @example
        Lib.CommonDialog.PopupReason({
                title: "Reason popup title",
                helpId: 2522,
                reasonListLabel: "choose a reason",
                possibleValues: "None=\r\nA=Reason A\r\nB=Reason B",
                currentReason: "B",
                currentComment: "no comment",
                onClickOk: function(result)
                {
                    Log.Info("Selected reason: " + result.reason);
                    Log.Info("Comment set: " + result.comment);
                }
            });
         */
        function PopupReason(config) {
            PopupComment(config, true);
        }
        CommonDialog.PopupReason = PopupReason;
        function PopupYesCancel(callback, title, message, yesLabel, cancelLabel) {
            var fillPopup = function (dialog) {
                if (!Sys.Helpers.IsArray(message)) {
                    message = [message];
                }
                message = message.concat(Sys.Helpers.Globals.Language.Translate(yesLabel || "_Yes"), Sys.Helpers.Globals.Language.Translate(cancelLabel || "_Cancel"));
                var control = dialog.AddDescription("Message__");
                control.SetText(message);
                dialog.HideDefaultButtons();
                control = dialog.AddButton("Yes__", yesLabel || "_Yes");
                control.SetSubmitStyle();
                dialog.AddButton("Cancel__", cancelLabel || "_Cancel");
            };
            var commitPopup = function () {
                callback("Yes");
            };
            var handlePopup = function (dialog, tabId, event, control) {
                if (event === "OnClick") {
                    switch (control.GetName()) {
                        case "Yes__":
                            dialog.Commit();
                            break;
                        case "Cancel__":
                        default:
                            dialog.Cancel();
                            break;
                    }
                }
            };
            var cancelPopup = function () {
                callback("Cancel");
            };
            Sys.Helpers.Globals.Popup.Dialog(title, null, fillPopup, commitPopup, null, handlePopup, cancelPopup);
        }
        CommonDialog.PopupYesCancel = PopupYesCancel;
        function PopupYesNoCancel(callback, title, message, yesLabel, noLabel, cancelLabel) {
            var fillPopup = function (dialog) {
                if (!Sys.Helpers.IsArray(message)) {
                    message = [message];
                }
                message = message.concat(Sys.Helpers.Globals.Language.Translate(yesLabel || "_Yes"), Sys.Helpers.Globals.Language.Translate(noLabel || "_No"), Sys.Helpers.Globals.Language.Translate(cancelLabel || "_Cancel"));
                var control = dialog.AddDescription("Message__");
                control.SetText(message);
                dialog.HideDefaultButtons();
                control = dialog.AddButton("Yes__", yesLabel || "_Yes");
                control.SetSubmitStyle();
                dialog.AddButton("No__", noLabel || "_No");
                dialog.AddButton("Cancel__", cancelLabel || "_Cancel");
            };
            var commitPopup = function () {
                callback("Yes");
            };
            var handlePopup = function (dialog, tabId, event, control) {
                if (event === "OnClick") {
                    switch (control.GetName()) {
                        case "Yes__":
                            dialog.Commit();
                            break;
                        case "No__":
                            callback("No");
                            break;
                        case "Cancel__":
                        default:
                            dialog.Cancel();
                            break;
                    }
                }
            };
            var cancelPopup = function () {
                callback("Cancel");
            };
            Sys.Helpers.Globals.Popup.Dialog(title, null, fillPopup, commitPopup, null, handlePopup, cancelPopup);
        }
        CommonDialog.PopupYesNoCancel = PopupYesNoCancel;
        /**
         * Handles form alert messages, so they are displayed only once
         * @namespace Lib.CommonDialog.NextAlert
         */
        CommonDialog.NextAlert = {
            /**
             * Sets the next alert (and possibly overwrites a previous one)
             * @param {string} title - title of the alert
             * @param {string} message - message of the alert
             * @param {object} [options] - options
             * @param {boolean} [options.isError=true] - true if the alert is an error. otherwise it is an information
             * @param {string} [options.behaviorName] - name of the behavior (this is a document-specific information)
             */
            Define: function (title, message, options) {
                var args = [];
                for (var _i = 3; _i < arguments.length; _i++) {
                    args[_i - 3] = arguments[_i];
                }
                var data = Sys.Helpers.Extend({
                    title: title,
                    message: message,
                    isError: true,
                    params: Array.prototype.slice.call(arguments, 3)
                }, options || {});
                Log[data.isError ? "Error" : "Warn"]("NextAlert: '".concat(data.title, "' - '").concat(data.message, "' - '").concat(JSON.stringify(data.params), "'")); // left untranslated on purpose
                Variable.SetValueAsString("CommonDialog_NextAlert", JSON.stringify(data));
            },
            DefineOptions: function (options) {
                var data = Variable.GetValueAsString("CommonDialog_NextAlert");
                if (!Sys.Helpers.IsEmpty(data)) {
                    data = JSON.parse(data);
                    data = Sys.Helpers.Extend(data, options || {});
                    Variable.SetValueAsString("CommonDialog_NextAlert", JSON.stringify(data));
                }
            },
            /**
             * Returns the nextAlert object serialized on record, null otherwise.
             * @returns {object} nextAlert description object
             */
            GetNextAlert: function () {
                var nextAlert = Variable.GetValueAsString("CommonDialog_NextAlert");
                if (!Sys.Helpers.IsEmpty(nextAlert)) {
                    return JSON.parse(nextAlert);
                }
                return null;
            },
            /**
             * Shows an alert with a popup, then disables it
             * @memberOf Lib.CommonDialog.NextAlert
             * @param {object.<string, object>} [behaviors] - map of behaviors. tells what to do, for each known behavior. The engine will use the behavior of the current alert
             * if not set, or if the alert behavior does not exists in the map, the alert is shown.
             * @param {string|function} behaviors[].IsShowable - true if the alert should be showned
             * @param {string|function} behaviors[].OnOK - callback when OK is clicked on the popup
             */
            Show: function (behaviors) {
                var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                if (nextAlert) {
                    var behavior = behaviors && nextAlert.behaviorName && (nextAlert.behaviorName in behaviors) ? behaviors[nextAlert.behaviorName] : {};
                    if (!Sys.Helpers.IsFunction(behavior.IsShowable) || behavior.IsShowable()) {
                        if (Sys.Helpers.IsFunction(behavior.Popup)) {
                            behavior.Popup(nextAlert);
                        }
                        else {
                            Sys.Helpers.Globals.Popup.Alert([nextAlert.message].concat(nextAlert.params), nextAlert.isError, behavior.OnOK, nextAlert.title);
                        }
                    }
                    if (!(behavior.KeepAlert || nextAlert.KeepAlert)) {
                        Lib.CommonDialog.NextAlert.Reset();
                    }
                }
            },
            /**
             * Clears the current alert (if any) on the form
             */
            Reset: function () {
                Variable.SetValueAsString("CommonDialog_NextAlert", "");
            },
            PopupYesCancel: function (callback, nextAlert, yesLabel, cancelLabel) {
                Lib.CommonDialog.PopupYesCancel(callback, nextAlert.title, [nextAlert.message].concat(nextAlert.params), yesLabel, cancelLabel);
            },
            PopupYesNoCancel: function (callback, nextAlert, yesLabel, noLabel, cancelLabel) {
                Lib.CommonDialog.PopupYesNoCancel(callback, nextAlert.title, [nextAlert.message].concat(nextAlert.params), yesLabel, noLabel, cancelLabel);
            }
        };
        /**
         * Popup a dialog from with Yes and Cancel button.
         * An optional label can be displayed to add an explation.
         * An option textbox can be displayed to allow the user to write a comment
         * The width of the popup is forced to 400px
         * @param {object} config contains the display configuration of the box
         * @param {string} config.title - contains the title of the dialog
         * @param {string} config.explanationLabel - If not null, display this label at the top of the popup
         * @param {string} config.allowComment - true to display a textbox. Default is hide.
         * @param {string} config.currentComment - Set the initial value of the contains the current comment text
         * @param {Lib.CommonDialog.onClickOkCallBack} config.onClickOk - the callback that handles the response when the user selects an item
         *
         * @example
        Lib.CommonDialog.PopupOkExtended({
                title: "Popup title",
                explanationLabel: "You can fill a comment",
                allowComment: true,
                currentComment: "no comment",
                onClickOk: function(result)
                {
                    Log.Info("Comment set: " + result.comment);
                }
            });
         */
        function PopupOkExtended(config) {
            var fillPopup = function (dialog) {
                // Display the label with the explanation if needed
                if (config.explanationLabel) {
                    var explanationControl = dialog.AddDescription("explanationLabel", null, 400);
                    explanationControl.SetText(config.explanationLabel);
                }
                // Display the multilineTextBox if needed
                if (config.allowComment === true) {
                    var commentControl = dialog.AddMultilineText("Comment", "_Comment", 400);
                    commentControl.SetText(config.currentComment);
                    dialog.RequireControl("Comment", config.requiredComment === true);
                }
            };
            var commitPopup = function (dialog) {
                var comment = "";
                if (config.allowComment === true) {
                    comment = dialog.GetControl("Comment").GetValue();
                }
                var result = {
                    comment: comment
                };
                config.onClickOk(result);
            };
            Sys.Helpers.Globals.Popup.Dialog(config.title, null, fillPopup, commitPopup);
        }
        CommonDialog.PopupOkExtended = PopupOkExtended;
    })(CommonDialog = Lib.CommonDialog || (Lib.CommonDialog = {}));
})(Lib || (Lib = {}));
