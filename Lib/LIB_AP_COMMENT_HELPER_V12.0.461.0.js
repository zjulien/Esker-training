/* LIB_DEFINITION{
  "name": "Lib_AP_Comment_Helper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "helpers to compute history with current comment and action given (approve, reject...)",
  "require": [
    "Lib_AP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var CommentHelper;
        (function (CommentHelper) {
            /* Helper for UpdateHistory
                * Update history with current comment and action given (approve, reject...)
                * Clear the comment area
                */
            var DefaultCommentPlaceholder = Language.Translate("_Enter your comment...", false);
            function UpdateHistory(lazyAction, bStoreLastComment, ignoreComment, ignoreUser, reasonField) {
                var action = Language.TranslateLazyTranslation(lazyAction);
                var newComment = ignoreComment ? "" : Lib.AP.CommentHelper.GetReliableComment();
                var reason = Data.GetValue(reasonField ? reasonField : "AsideReason__");
                var holdingComment = bStoreLastComment ? newComment : "";
                var userName = "";
                Data.SetValue("HoldingComment__", holdingComment);
                if (reason) {
                    action = action + " (" + Language.Translate(reason) + ")";
                }
                if (!ignoreUser) {
                    userName = Data.GetValue("LastValidatorName__");
                }
                Lib.AP.CommentHelper.AddLine(action, newComment, userName);
            }
            CommentHelper.UpdateHistory = UpdateHistory;
            function ComputeLazyHistoryLine(action, description, user, bNoDate) {
                var historyLine;
                if (user) {
                    historyLine = Language.CreateLazyTranslation("_CommentHistory", action, user);
                }
                else {
                    historyLine = Language.CreateLazyTranslation("_CommentHistoryNoUser", action);
                }
                if (!bNoDate) {
                    Language.CreateLazyTranslation("{0} - {1}", Lib.AP.CommentHelper.GetDate(), historyLine);
                }
                if (description) {
                    historyLine = Language.CreateLazyTranslation("{0}: {1}", historyLine, description);
                }
                return historyLine;
            }
            CommentHelper.ComputeLazyHistoryLine = ComputeLazyHistoryLine;
            function ComputeHistoryLine(action, description, user, bNoDate) {
                var historyLine;
                var dateStamp = bNoDate ? "" : Lib.AP.CommentHelper.GetDate() + " - ";
                if (user) {
                    historyLine = dateStamp + Language.Translate("_CommentHistory", true, action, user);
                }
                else {
                    historyLine = dateStamp + Language.Translate("_CommentHistoryNoUser", true, action);
                }
                if (description && description.length > 0) {
                    historyLine = Language.Translate("{0}: {1}", false, historyLine, description);
                }
                return historyLine;
            }
            CommentHelper.ComputeHistoryLine = ComputeHistoryLine;
            /**
            * Add a line with in the history of the invoice
            * A history line is composed by a 'DateTime action by user : description'
            * @param {string} action The action is just after the date time
            * @param {string} description A detailled description added after the action
            * @param {string} user The user associated with the action
            **/
            function AddLine(action, description, user) {
                if (description && description.length > 0) {
                    Data.SetValue("Comment__", "");
                }
                var newLine = Lib.AP.CommentHelper.ComputeHistoryLine(action, description, user) + "\n";
                Data.SetValue("History__", newLine + Data.GetValue("History__"));
            }
            CommentHelper.AddLine = AddLine;
            function ResetReasonExcept(reasonField) {
                if (reasonField !== "AsideReason__") {
                    Data.SetValue("AsideReason__", "");
                }
                if (reasonField !== "BackToAPReason__") {
                    Data.SetValue("BackToAPReason__", "");
                }
                if (reasonField !== "RejectReason__") {
                    Data.SetValue("RejectReason__", "");
                }
                Data.SetValue("HoldingComment__", "");
            }
            CommentHelper.ResetReasonExcept = ResetReasonExcept;
            function FormatDate(x) {
                return x < 10 ? "0" + x : x.toString();
            }
            CommentHelper.FormatDate = FormatDate;
            function GetDate() {
                var setDate = new Date();
                return Lib.AP.CommentHelper.FormatDate(setDate.getDate()) + "/" + Lib.AP.CommentHelper.FormatDate(setDate.getMonth() + 1) + "/" + setDate.getFullYear() + " " + Lib.AP.CommentHelper.FormatDate(setDate.getHours()) + ":" + Lib.AP.CommentHelper.FormatDate(setDate.getMinutes()) + ":" + Lib.AP.CommentHelper.FormatDate(setDate.getSeconds());
            }
            CommentHelper.GetDate = GetDate;
            /**
            * Returns a reliable value of Comment__ field content.
            * On some browsers (IE<10), the placeholder text "_Enter your comment..." could be returned as its value.
            */
            function GetReliableComment() {
                var commentValue = Data.GetValue("Comment__");
                if (commentValue === DefaultCommentPlaceholder) {
                    // Placeholder is not a real comment, ignoring it
                    commentValue = "";
                    // Update Comment__ value for later processing (especially FTP export)
                    Data.SetValue("Comment__", "");
                }
                return commentValue;
            }
            CommentHelper.GetReliableComment = GetReliableComment;
        })(CommentHelper = AP.CommentHelper || (AP.CommentHelper = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
