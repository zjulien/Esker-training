/* eslint-disable dot-notation */
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing.Workflow_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing",
  "require": [
    "Sys/Sys_Helpers_Array",
    "LIB_P2P.Base_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        Purchasing.roleRequester = "_Role requester";
        Purchasing.roleBuyer = "_Role buyer";
        Purchasing.roleReviewer = "_Role reviewer";
        Purchasing.roleApprover = "_Role approver";
        Purchasing.roleVendor = "_Role vendor";
        Purchasing.roleReceiver = "_Role receiver";
        Purchasing.roleAdvisor = "_Role advisor";
        Purchasing.roleTreasurer = "_Role treasurer";
        Purchasing.sequenceRoleRequester = "requester";
        Purchasing.sequenceRoleBuyer = "buyer";
        Purchasing.sequenceRoleReviewer = "reviewer";
        Purchasing.sequenceRoleApprover = "approver";
        Purchasing.sequenceRoleReceiver = "receiver";
        Purchasing.sequenceRoleAdvisor = "advisor";
        Purchasing.sequenceRoleTreasurer = "treasurer";
        function IsRequester(currentRole) {
            return currentRole === Lib.Purchasing.roleRequester;
        }
        Purchasing.IsRequester = IsRequester;
        function IsApprover(currentRole) {
            return currentRole === Lib.Purchasing.roleApprover;
        }
        Purchasing.IsApprover = IsApprover;
        function ContributorIsCurrentUser(contributor, currentUser) {
            return contributor && Lib.P2P.CurrentUserMatchesLogin(contributor.login, currentUser);
        }
        Purchasing.ContributorIsCurrentUser = ContributorIsCurrentUser;
        /**
         * Return true if the current user is in the reviewal(controller) workflow
         */
        function IsReviewerInWorkflow(workflow, currentUser) {
            var reviewersList = workflow.GetContributorsByRole(Lib.Purchasing.sequenceRoleReviewer);
            var additionalReviewersList = workflow.GetAdditionalContributors();
            additionalReviewersList = Sys.Helpers.Array.Filter(additionalReviewersList, function (contributor) {
                return contributor && contributor.role === Lib.Purchasing.roleReviewer;
            });
            return !!((reviewersList && Sys.Helpers.Array.Find(reviewersList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); }))
                || (additionalReviewersList && Sys.Helpers.Array.Find(additionalReviewersList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); })));
        }
        Purchasing.IsReviewerInWorkflow = IsReviewerInWorkflow;
        /**
         * Return true if the current user is in the approval workflow
         */
        function IsApproverInWorkflow(workflow, currentUser) {
            var approverList = workflow.GetContributorsByRole("approver");
            var additionalApproversList = workflow.GetAdditionalContributors();
            additionalApproversList = Sys.Helpers.Array.Filter(additionalApproversList, function (contributor) {
                return contributor && contributor.role === Lib.Purchasing.roleApprover;
            });
            return !!((approverList && Sys.Helpers.Array.Find(approverList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); }))
                || (additionalApproversList && Sys.Helpers.Array.Find(additionalApproversList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); })));
        }
        Purchasing.IsApproverInWorkflow = IsApproverInWorkflow;
        /**
         * Return true if the current user is in the buyers workflow
         */
        function IsBuyerInWorkflow(workflow, currentUser) {
            var buyersList = workflow.GetContributorsByRole("buyer");
            var additionalBuyersList = workflow.GetAdditionalContributors();
            additionalBuyersList = Sys.Helpers.Array.Filter(additionalBuyersList, function (contributor) {
                return contributor && contributor.role === Lib.Purchasing.roleBuyer;
            });
            return !!((buyersList && Sys.Helpers.Array.Find(buyersList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); }))
                || (additionalBuyersList && Sys.Helpers.Array.Find(additionalBuyersList, function (contributor) { return ContributorIsCurrentUser(contributor, currentUser); })));
        }
        Purchasing.IsBuyerInWorkflow = IsBuyerInWorkflow;
        function IsMultipleBuyerInWorkflow(workflow) {
            var buyersList = workflow.GetContributorsByRole("buyer");
            // maybe too easy ? All buyer in additionalBuyersList must be in the contributors by role ??
            return buyersList.length > 1;
        }
        Purchasing.IsMultipleBuyerInWorkflow = IsMultipleBuyerInWorkflow;
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
