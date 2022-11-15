///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Wizard_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "Lib_V12.0.461.0"
  ]
}*/
var Lib;
Lib.AddLib("Wizard", function ()
{
	/*wizard*/
	var wizard = {
		steps: [],
		currentStep: 0,
		nextButton: null,
		prevButton: null,
		wizardControl: null,
		descriptionControl: null,
		helpId: 0,
		width: 730,
		cellsWidth: 150,
		SaveCurrentStep: null,
		Init: function (params)
		{
			this.AddNextButton(params.nextButton, params.onNextButton);
			this.AddPreviousButton(params.previousButton, params.onPreviousButton);
			if (params.steps)
			{
				this.steps = [];
				for (var s in params.steps)
				{
					this.steps.push(new Step(params.steps[s]));
				}
			}

			if (typeof params.LoadFirstStep === 'function')
			{
				this.currentStep = parseInt(params.LoadFirstStep(), 10) || 0;

				if (!this.steps[this.currentStep].isVisible())
				{
					// Get the first visible pane
					this.currentStep = -1;
					this.currentStep = this.GetNextStep();
				}
			}

			if (typeof params.SaveCurrentStep === 'function')
			{
				this.SaveCurrentStep = params.SaveCurrentStep;
			}

			this.descriptionControl = params.descriptionControl;
			this.wizardControl = params.wizardControl;
			if (this.wizardControl)
			{
				this.wizardControl.SetCSS('.wizard-container {' +
					'	left: 50%;' +
					'	position: absolute;' +
					'}' +
					'.wizard-timeline {' +
					'	content: "";' +
					'	height: 3px;' +
					'	margin-top: 35px;' +
					'	position: absolute;' +
					'	background-color: #00b4bd;' +
					'	z-index: 10;' +
					'	left: 0px;' +
					'}' +
					'.wizard {' +
					'	height: 150px;' +
					'	padding-bottom: 15px;' +
					'	z-index: 30;' +
					'	left: 0px;' +
					'	position: absolute;' +
					'	color: #263645;' +
					'}' +
					'.wizard tr {' +
					'	height: 72px;' +	// with timeline's height: 35px and wizard height: 150px, to have timeline on the middle of the icons => 72px
					'}' +
					'.wizard td {' +
					'	text-align: center;' +
					'	font-size: 14px;' +
					'}' +
					'.wizard td i {' +
					'	width: 50px;' +
					'	padding: 10px;' +
					'}' +
					'.wizard td.text {' +
					'	text-transform: uppercase;' +
					'	white-space: pre-wrap;' +
					'	vertical-align: top;' +
					'	font-size: 12px;' +
					'}' +
					'.wizard td.wizardSelected {' +
					'	color: White;' +
					'}');
			}
			this.InitCss();

			if (typeof params.RefreshDefaultValues === 'function')
			{
				this.HideAllPanels();
				var self = this;
				params.RefreshDefaultValues(function ()
				{
					self.ShowStep();
					self.ApplyStartCallback(self.steps[self.currentStep]);
				});
			}
			else
			{
				this.ShowStep();
				this.ApplyStartCallback(this.steps[this.currentStep]);
			}
		},
		InitCss: function ()
		{
			if (this.wizardControl)
			{
				var css = this.wizardControl.GetCSS();

				this.cellsWidth = this.width / this.steps.length;
				var timelineWidth = this.width;
				var marginLeft = 0;

				css += ' .wizard-timeline {margin-left: ' + marginLeft + 'px;width: ' + timelineWidth + 'px;} .cd-timelines {margin-left: ' + marginLeft + 'px;} .wizard {width: ' + this.width + 'px;} .wizard td {width: ' + this.cellsWidth + 'px;}';
				css += ' .wizard-container { margin-left: -' + Math.round(this.width / 2) + 'px }';
				this.wizardControl.SetCSS(css);
			}
		},
		ShowStep: function ()
		{
			this.ShowCurrentPanels();
			this.DrawSteps();
			this.DisplayButtons();

			if (this.descriptionControl)
			{
				this.descriptionControl.SetLabel(this.steps[this.currentStep].description);
			}

			Process.SetHelpId(this.steps[this.currentStep].helpId || this.helpId);
		},
		HideAllPanels: function ()
		{
			for (var i = 0; i < this.steps.length; i++)
			{
				this.steps[i].ShowPanels(false);
			}
		},
		HidePanel: function (index)
		{
			this.steps[index].isVisible = function ()
			{
				return false;
			};
		},
		ShowPanel: function (index)
		{
			this.steps[index].isVisible = function ()
			{
				return true;
			};
		},
		GetPanelIndex: function (name)
		{
			for (var i = 0; i < this.steps.length; i++)
			{
				if (this.steps[i].title === name)
				{
					return i;
				}
			}
		},
		ShowCurrentPanels: function ()
		{
			this.HideAllPanels();
			this.steps[this.currentStep].ShowPanels(true);
		},
		DrawSteps: function ()
		{
			if (this.wizardControl)
			{
				var html = '<div class="wizard-container">';
				html += '<div class="wizard-timeline"></div>';
				html += '<table class="wizard"><tr>';

				for (var i = 0; i < this.steps.length; i++)
				{
					if (this.steps[i].isVisible())
					{
						html += this.DrawStepCircle(i);
					}
				}

				html += '</tr><tr>';
				for (var index = 0; index < this.steps.length; index++)
				{
					if (this.steps[index].isVisible())
					{
						var name = this.steps[index].GetLabel();
						if (name != null)
						{
							html += this.DrawStep(index, name);
						}
					}
				}

				html += '</tr></table></div>';
				this.wizardControl.SetHTML(html);
			}
		},
		DrawStepCircle: function (idx)
		{
			var result = '<td class="';
			if (this.currentStep === idx)
			{
				result += ' wizardSelected';
			}
			result += '">';
			result += '<i class="fa ' + this.steps[idx].icon + ' fa-2x text-backgroundcolor-color1"></i>';
			result += '</td>';
			return result;
		},
		DrawStep: function (idx, name)
		{
			var result = '<td class="text';
			if (this.currentStep === idx)
			{
				result += ' wizardSelected';
			}
			result += '" id="btn_step';
			result += idx;
			result += '" >';
			result += name;
			result += '</td>';
			return result;
		},
		DisplayButtons: function ()
		{
			this.nextButton.SetDisabled(this.GetNextStep() === -1);

			this.prevButton.SetDisabled(this.GetPreviousStep() === -1);
		},
		ApplyStartCallback: function (step)
		{
			if (typeof step.onStart === 'function')
			{
				step.onStart();
			}
		},
		ApplyQuitCallback: function (step, goToNext)
		{
			if (typeof step.onQuit === 'function')
			{
				return step.onQuit(goToNext);
			}

			return true;
		},
		AddNextButton: function (control, callback)
		{
			if (control)
			{
				var self = this;
				control.OnClick = function ()
				{
					if (self.currentStep < self.steps.length - 1 &&
						self.ApplyQuitCallback(self.steps[self.currentStep], true))
					{
						var nextStep = self.GetNextStep();
						if (nextStep != -1)
						{
							self.currentStep = nextStep;
							self.ShowStep();
							self.ApplyStartCallback(self.steps[self.currentStep]);
							if (typeof self.SaveCurrentStep === 'function')
							{
								self.SaveCurrentStep(self.currentStep);
							}
							if (callback)
							{
								callback(self.steps[self.currentStep].title);
							}
						}
					}
				};
			}
			this.nextButton = control;
		},
		AddPreviousButton: function (control, callback)
		{
			if (control)
			{
				var self = this;
				control.OnClick = function ()
				{
					if (self.currentStep > 0 &&
						self.ApplyQuitCallback(self.steps[self.currentStep], false))
					{
						var previousStep = self.GetPreviousStep();
						if (previousStep != -1)
						{
							self.currentStep = previousStep;
							self.ShowStep();
							self.ApplyStartCallback(self.steps[self.currentStep]);
							if (typeof self.SaveCurrentStep === 'function')
							{
								self.SaveCurrentStep(self.currentStep);
							}
							if (callback)
							{
								callback(self.steps[self.currentStep].title);
							}
						}
					}
				};
			}
			this.prevButton = control;
		},
		GetNextStep: function ()
		{
			var stepsNumber = this.steps.length;
			var nextStepIndex = this.currentStep + 1;
			while (nextStepIndex < stepsNumber && !this.steps[nextStepIndex].isVisible())
			{
				nextStepIndex++;
			}

			return nextStepIndex === stepsNumber ? -1 : nextStepIndex;
		},
		GetPreviousStep: function ()
		{
			var previuosStepIndex = this.currentStep - 1;
			while (previuosStepIndex >= 0 && !this.steps[previuosStepIndex].isVisible())
			{
				previuosStepIndex--;
			}

			return previuosStepIndex;
		},
		SetTranslatedTitle: function (idx, title)
		{
			this.steps[idx].translatedTitle = title;
			if (this.steps[idx].isVisible())
			{
				this.DrawSteps();
			}
		}
	};

	/* Step
	 * panels : an array of controls to show
	 * icon : an icon to represent this step
	 * titre : the key of the title
	 * description : the key of the description
	 * onStart : a callback to execute at the beginning of the step
	 */
	function Step(params)
	{
		this.title = params.title;
		this.description = params.description ? Language.Translate(params.description) : "";
		this.panels = params.panels || [];
		this.icon = params.icon || "fa-circle";
		this.helpId = params.helpId || null;
		this.onStart = params.onStart || null;
		this.onQuit = params.onQuit || null;
		this.translatedTitle = params.title ? Language.Translate(params.title) : "";
		this.isVisible = function ()
		{
			if (params.isVisible === undefined)
			{
				return true;
			}
			return params.isVisible();
		};
	}

	Step.prototype = {
		ShowPanels: function (show)
		{
			if (this.panels)
			{
				for (var j = 0; j < this.panels.length; j++)
				{
					this.panels[j].Hide(!show);
				}
			}
		},

		GetLabel: function ()
		{
			if (this.translatedTitle)
			{
				return this.translatedTitle;
			}
			else if (this.panels != null && this.panels.length > 0)
			{
				return Language.Translate(this.panels[0].GetLabel());
			}
			return null;
		}
	};

	/*Tools*/
	var tools = {
		DrawScissors: function ()
		{
			var html = '<td class="split">';
			html += '<div class="dots"></div><i class="fa fa-scissors fa-rotate-270">';
			html += '</td>';
			return html;
		},
		DrawStringCutOff: function (type, stringAtEnd)
		{
			var html = '';
			if (type === "ONSTRING" || type === "ONAREA")
			{
				html = '<td class="keystring';
				if (stringAtEnd)
				{
					html += ' right';
				}

				html += '">';
				html += type === "ONSTRING" ? Language.Translate("string") : Language.Translate("area");
				html += '<div class="key';

				if (stringAtEnd)
				{
					html += ' right';
				}
				html += '"></div></td>';
			}
			else
			{
				html += '<td></td>';
			}

			return html;
		},
		DrawDocument: function (color, variable)
		{
			var html = '<td class="text-color-' + color + '">';
			html += '<span class="offset"><i class="fa fa-file-text-o"></i></span>';
			html += '<span class="elli">...</span>';
			html += '<span class="offset"><i class="fa fa-file-text-o"></i></span>';
			if (variable)
			{
				html += '<span class="offset"><i class="fa fa-file-text-o"></i></span>';
			}
			html += '</td>';
			return html;
		},
		DrawSplittingPreview: function (offset, type, stringAtEnd, controlHTML)
		{
			var html = '<table class="preview" cellpadding="0" cellspacing="0">';

			// text indicating split location
			html += '<tr><td></td><td></td>';
			html += this.DrawStringCutOff(type, stringAtEnd);
			html += '<td></td>';
			html += this.DrawStringCutOff(type, stringAtEnd);
			html += '<td></td><td></td></tr>';

			// Document + scissors
			html += '<tr>';
			if (offset)
			{
				html += this.DrawDocument("color7", false);
				html += this.DrawScissors();
			}
			else
			{
				html += '<td class="empty"></td><td class="empty"></td>';
			}
			html += this.DrawDocument("color4", false);
			if (type !== "SIMPLE")
			{
				html += this.DrawScissors();
			}
			html += this.DrawDocument("color4", type !== 'NPAGES');
			if (type !== "SIMPLE")
			{
				html += this.DrawScissors();
			}
			html += '<td class="text-color-color4"><span class="elli">...</span></td></tr>';

			if (type !== "SIMPLE")
			{
				html += '<tr>';
				if (offset)
				{
					html += '<td class="docborder"></td>';
				}
				else
				{
					html += '<td class="docbordernone"></td>';
				}
				html += '<td class="docbordernone"></td>';
				html += '<td class="docborder"></td>';
				html += '<td class="docbordernone"></td>';
				html += '<td class="docborder"></td>';
				html += '<td class="docbordernone"></td>';
				html += '<td class="docborderend"></td>';
				html += '</tr>';
				html += '<tr>';
				if (offset)
				{
					html += '<td class="doc">';
					html += Language.Translate("offset");
					html += '</td>';
				}
				else
				{
					html += '<td class="doc"></td>';
				}
				html += '<td class="doc"></td>';
				html += '<td class="doc">';
				html += Language.Translate("doc 1");
				html += '</td>';
				html += '<td class="doc"></td>';
				html += '<td class="doc">';
				html += Language.Translate("doc 2");
				html += '</td>';
				html += '<td class="doc"></td></tr>';
			}
			html += '</table>';
			controlHTML.SetCSS('.preview {' +
				'	position: absolute;' +
				'	left: 220px;' +
				'	top: 0px;' +
				'}' +
				'.preview td {' +
				'	text-align: left;' +
				'	font-size: 20pt;' +
				'	height: 20px;' +
				'}' +
				'.preview td.empty {' +
				'	width: 42px;' +
				'}' +
				'.preview td.split {' +
				'	font-size: 10pt;' +
				'	color: red;' +
				'}' +
				'.dots {' +
				'	position: relative;' +
				'	left: 7px;' +
				'	top: 2px;' +
				'	border-left: dashed 1px red;' +
				'	height: 25px;' +
				'	width: 2px;' +
				'}' +
				'.key {' +
				'	position: relative;' +
				'	float: left;' +
				'	left: 7px;' +
				'	top: 15px;' +
				'	border-left: solid 1px black;' +
				'	height: 15px;' +
				'	width: 2px;' +
				'}' +
				'.key.right {' +
				'	float: right;' +
				'	left: inherit;' +
				'	right: 10px;' +
				'}' +
				'.preview td.keystring {' +
				'	text-align: left;' +
				'	font-size: 10pt;' +
				'}' +
				'.preview td.keystring.right {' +
				'	text-align: right;' +
				'}' +
				'.elli {' +
				'	font-size: 10pt;' +
				'}' +
				'span {' +
				'	padding: 3px;' +
				'}' +
				'.preview td.docbordernone {' +
				'	height: 7px;' +
				'}' +
				'.preview td.docborderend {' +
				'	border-bottom: solid 2px LightGray;' +
				'	border-left: solid 2px LightGray;' +
				'	height: 7px;' +
				'}' +
				'.preview td.docborder {' +
				'	border-bottom: solid 2px LightGray;' +
				'	border-left: solid 2px LightGray;' +
				'	border-right: solid 2px LightGray;' +
				'	height: 7px;' +
				'}' +
				'.preview td.doc {' +
				'	font-size: 10pt;' +
				'	text-align: center;' +
				'}');
			controlHTML.SetHTML(html);
		},
		HandleHTMLToggle: function (ctrlHtml, dest, title)
		{
			dest.Hide(true);
			var html = ctrlHtml.GetHTML();
			html = html.replace("-minus-", "-plus-");
			html = html.replace("$TITLE$", title);
			ctrlHtml.SetHTML(html);
			ctrlHtml.OnClick = function ()
			{
				var visible = dest.IsVisible();
				dest.Hide(visible);
				if (!visible)
				{
					ctrlHtml.SetHTML(html.replace("-plus-", "-minus-"));
				}
				else
				{
					ctrlHtml.SetHTML(html.replace("-minus-", "-plus-"));
				}
			};
		}
	};

	return {
		Wizard: wizard,
		Tools: tools
	};
});