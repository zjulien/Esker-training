/* LIB_DEFINITION{
  "name": "Lib_CM_Client_CreditApplicationReview_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "",
  "require": []
}*/

//"require": ["Sys/Sys_Helpers_String"]
var Lib = Lib || {};
Lib.CM_Client = Lib.CM_Client || {};
Lib.CM_Client.CreditApplicationReview = (function ()
{
	var ReviewPopup = (function ()
	{
		function ReviewPopup(options)
		{
			this.controlWidth = "150px";
			this.title = "_Edit credit information";
			this.controls = {};
			this.credAppCreationCallback = options.credAppCreationCallback;
			for (var opt in options)
			{
				if (options.hasOwnProperty(opt) && typeof options[opt] !== 'function')
				{
					this[opt] = options[opt];
				}
			}
		}

		ReviewPopup._controlsName = {
			creditLimit: "ctrlRecommendedCreditLimit",
			currency: "ctrlCurrency",
			periodicReview: "ctrlPeriodicReview",
			nextReview: "ctrlNextReview",
			paymentTerms: "ctrlRecommendedPaymentTerms",
			riskCategory: "ctrlRiskCategory",
			comment: "ctrlComment"
		};

		ReviewPopup.prototype = {
			Show: function ()
			{
				Popup.Dialog(this.title, this, this.Filler, this.Commiter, this.Validator, this.Handler);
			},
			Filler: function (dialog)
			{
				this.controls.creditLimit = dialog.AddInteger(ReviewPopup._controlsName.creditLimit, "_ProposedCreditLimit", this.controlWidth);
				this.controls.creditLimit.SetValue(this.creditLimit);
				this.controls.currency = dialog.AddComboBox(ReviewPopup._controlsName.currency, "_Currency", this.controlWidth);
				this.controls.currency.SetAvailableValues(["USD", "EUR", "AUD", "GBP"]);
				this.controls.currency.SetValue(this.currency || "USD");
				this.controls.periodicReview = dialog.AddComboBox(ReviewPopup._controlsName.periodicReview, "_PeriodicReview", this.controlWidth);
				this.controls.periodicReview.SetAvailableValues(["noChange=_noChange", "noReview=_noReview", "3=_3Months", "6=_6Months", "12=_1Year", "customDate=_customDate"]);
				this.controls.nextReview = dialog.AddDate(ReviewPopup._controlsName.nextReview, "_NextReview", this.controlWidth);
				dialog.HideControl(this.controls.nextReview, true);
				this.controls.paymentTerms = dialog.AddComboBox(ReviewPopup._controlsName.paymentTerms, "_SuggestedPaymentTerms", this.controlWidth);
				this.controls.paymentTerms.SetAvailableValues(this.paymentTermsValues);
				this.controls.paymentTerms.SetValue(this.paymentTerms);

				this.controls.riskCategory = dialog.AddComboBox(ReviewPopup._controlsName.riskCategory, "_RiskCategory", this.controlWidth);
				this.controls.riskCategory.SetAvailableValues(this.riskCategoriesValues);
				this.controls.riskCategory.SetValue(this.riskCategory);

				this.controls.comment = dialog.AddMultilineText(ReviewPopup._controlsName.comment, "_Comment", this.controlWidth);
				this.controls.comment.SetLineCount(4);

			},
			Commiter: function ()
			{
				var overridenValues = {
					ProposedCreditLimit__: this.controls.creditLimit.GetValue(),
					Currency__: this.controls.currency.GetValue(),
					SuggestedPaymentTerms__: this.controls.paymentTerms.GetValue(),
					RiskCategory__: this.controls.riskCategory.GetValue() || null,
					WorkflowComment__: this.controls.comment.GetValue(),
					PeriodicReview__: this.controls.periodicReview.GetSelectedOption() === "noChange" ? null : this.controls.periodicReview.GetSelectedOption(),
					NextReview__: this.controls.nextReview.GetValue() || null
				};

				var that = this;
				Process.CreateProcessInstance("CM - Credit Application", {}, {
					AncestorsRuid: ProcessInstance.id,
					CustomerID__: this.customerId,
					ReviewRequestedBy: User.fullName,
					LoginIdReviewRequestedBy: User.loginId,
					ReviewRequestedAt: new Date().toISOString(),
					CurrentRiskCategory: this.riskCategory,
					ADP: this.adp,
					internalScore: this.internalScore,
					reasonReview: "manual",
					OverridenValues: JSON.stringify(overridenValues)
				}, {
					callback: function (data) { return that.credAppCreationCallback && that.credAppCreationCallback(data); }
				});
			},
			Handler: function (dialog, tabId, event, control)
			{
				if (event === "OnChange" && control.GetName() === ReviewPopup._controlsName.periodicReview)
				{
					if (control.GetValue() === "customDate")
					{
						dialog.HideControl(this.controls.nextReview, false);
						this.controls.nextReview.SetReadOnly(false);
						dialog.RequireControl(this.controls.nextReview, true);
					}
					else
					{
						this.controls.nextReview.SetValue(null);
						dialog.HideControl(this.controls.nextReview, true);
						dialog.RequireControl(this.controls.nextReview, false);
					}
				}
			},
			Validator: function ()
			{
				var today = new Date();
				today.setHours(23, 59, 595, 998);
				if (this.controls.periodicReview.GetValue() === "customDate" && today > this.controls.nextReview.GetValue())
				{
					this.controls.nextReview.SetError("_nextReview in future");
					return false;
				}
				return true;
			}
		};

		return ReviewPopup;
	})();

	var CreditRequestPopup = (function ()
	{
		function CreditRequestPopup(options)
		{
			this.controlWidth = "150px";
			this.title = "_Credit check request";
			this.controls = {};
			this.credAppCreationCallback = options.credAppCreationCallback;
			for (var opt in options)
			{
				if (options.hasOwnProperty(opt) && typeof options[opt] !== 'function')
				{
					this[opt] = options[opt];
				}
			}
		}

		CreditRequestPopup._controlsName = {
			comment: "ctrlComment"
		};
		CreditRequestPopup.prototype = {
			Show: function ()
			{
				Popup.Dialog(this.title, this, this.Filler, this.Commiter);
			},
			Filler: function (dialog)
			{
				this.controls.comment = dialog.AddMultilineText(ReviewPopup._controlsName.comment, "_Comment", this.controlWidth);
				this.controls.comment.SetLineCount(4);
			},
			Commiter: function ()
			{
				var overridenValues = {
					WorkflowComment__: this.controls.comment.GetValue()
				};

				var that = this;
				Process.CreateProcessInstance("CM - Credit Application", {}, {
					AncestorsRuid: ProcessInstance.id,
					CustomerID__: this.customerId,
					ReviewRequestedBy: User.fullName,
					LoginIdReviewRequestedBy: User.loginId,
					ReviewRequestedAt: new Date().toISOString(),
					reasonReview: "creditCheckRequest",
					OverridenValues: JSON.stringify(overridenValues)
				}, {
					callback: function (data) { return that.credAppCreationCallback && that.credAppCreationCallback(data); }
				});
			}
		};
		return CreditRequestPopup;
	})();

	return {
		CreditReview: { Show: function (params) { new ReviewPopup(params).Show(); } },
		CreditRequest: { Show: function (params) { new CreditRequestPopup(params).Show(); } }
	};
})();
