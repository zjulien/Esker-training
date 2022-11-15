/* eslint-disable class-methods-use-this */
/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ConditionedPricing_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Parameters",
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ConditionedPricing;
        (function (ConditionedPricing) {
            ConditionedPricing.NB_THRESHOLD_MAX = 25;
            var Type;
            (function (Type) {
                Type["VolumePricing"] = "VolumePricing";
                Type["TieredPricing"] = "TieredPricing";
                Type["OveragePricing"] = "OveragePricing";
                Type["UniquePricing"] = "UniquePricing";
            })(Type = ConditionedPricing.Type || (ConditionedPricing.Type = {}));
            ConditionedPricing.CSVColumnName = {
                type: "Pricing model",
                threshold: function (idx) { return "Tier ".concat(idx, " start qty"); },
                unitPrice: function (idx) { return "Tier ".concat(idx, " unit price"); },
                base: function (idx) { return "Tier ".concat(idx, " base price"); }
            };
            var ConditionedPricingError = /** @class */ (function (_super) {
                __extends(ConditionedPricingError, _super);
                function ConditionedPricingError(message, translation) {
                    var _this = _super.call(this, message) || this;
                    _this.translationKey = translation;
                    return _this;
                }
                return ConditionedPricingError;
            }(Error));
            ConditionedPricing.ConditionedPricingError = ConditionedPricingError;
            var ThresholdsError = /** @class */ (function (_super) {
                __extends(ThresholdsError, _super);
                function ThresholdsError() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return ThresholdsError;
            }(ConditionedPricingError));
            ConditionedPricing.ThresholdsError = ThresholdsError;
            var FactoryError = /** @class */ (function (_super) {
                __extends(FactoryError, _super);
                function FactoryError() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return FactoryError;
            }(ConditionedPricingError));
            ConditionedPricing.FactoryError = FactoryError;
            var Factory = /** @class */ (function () {
                function Factory() {
                }
                Factory.FromData = function (data, noCheck) {
                    if (noCheck === void 0) { noCheck = true; }
                    var conditionedPricing = this.Get(data.type);
                    conditionedPricing.SetThresholds(data.thresholds, noCheck);
                    return conditionedPricing;
                };
                Factory.Get = function (type) {
                    var factory = this.factories[type];
                    if (!factory) {
                        throw new FactoryError("Invalid ConditionedPricing Type: ".concat(type), "_Invalid Conditioned Pricing : Unknow type");
                    }
                    return factory();
                };
                Factory.GetTypes = function () {
                    return Object.keys(this.factories);
                };
                Factory.factories = {};
                return Factory;
            }());
            ConditionedPricing.Factory = Factory;
            var CConditionedPricing = /** @class */ (function () {
                function CConditionedPricing() {
                }
                // eslint-disable-next-line class-methods-use-this
                CConditionedPricing.prototype.ParseInput = function (input) {
                    return {
                        threshold: this.ValidateInputThreshold(input),
                        unitPrice: this.ValidateInputUnitPrice(input),
                        base: this.ValidateInputBase(input)
                    };
                };
                // eslint-disable-next-line class-methods-use-this
                CConditionedPricing.prototype.ValidateInputThreshold = function (input) {
                    var threshold = parseFloat(input.threshold);
                    if (isNaN(threshold) || threshold < 0) {
                        throw new ThresholdsError("Invalid threshold", "_Invalid Conditioned Pricing : invalid threshold");
                    }
                    return new Sys.Decimal(threshold);
                };
                // eslint-disable-next-line class-methods-use-this
                CConditionedPricing.prototype.ValidateInputUnitPrice = function (input) {
                    var unitPrice = parseFloat(input.unitPrice);
                    if (isNaN(unitPrice) || unitPrice < 0) {
                        throw new ThresholdsError("Invalid unitprice", "_Invalid Conditioned Pricing : invalid unitprice");
                    }
                    return new Sys.Decimal(unitPrice);
                };
                // eslint-disable-next-line class-methods-use-this
                CConditionedPricing.prototype.ValidateInputBase = function (input) {
                    return new Sys.Decimal(parseFloat(input.base) || 0);
                };
                CConditionedPricing.prototype.SetThresholds = function (thresholds, noCheck) {
                    var _this = this;
                    if (noCheck === void 0) { noCheck = false; }
                    if (noCheck) {
                        this.thresholds = thresholds.map(function (threshold) { return _this.ParseInput(threshold); });
                    }
                    else {
                        if (!thresholds.length) {
                            throw new ThresholdsError("A threshold is required", "_Invalid Conditioned Pricing : No threshold");
                        }
                        if (thresholds.length > ConditionedPricing.NB_THRESHOLD_MAX) {
                            throw new ThresholdsError("The maximum threshold number allowed is ".concat(ConditionedPricing.NB_THRESHOLD_MAX), "_Invalid Conditioned Pricing : Limit exceeded");
                        }
                        this.thresholds = thresholds
                            .map(function (input) { return _this.ParseInput(input); })
                            .sort(function (t1, t2) { return t1.threshold.minus(t2.threshold).toNumber(); });
                        var thresholdSet_1 = new Set();
                        this.thresholds.forEach(function (_a) {
                            var threshold = _a.threshold;
                            return thresholdSet_1.add(threshold.toString());
                        });
                        if (thresholdSet_1.size !== this.thresholds.length) {
                            throw new ThresholdsError("Threshold should be unique", "_Invalid Conditioned Pricing : Duplicate threshold");
                        }
                        if (!this.thresholds[0].threshold.eq(0)) {
                            throw new ThresholdsError("The first threshold must be 0", "_Invalid Conditioned Pricing : First threshold");
                        }
                        this.ComputeThresholdsBase();
                    }
                };
                CConditionedPricing.prototype.ComputePrice = function (itemQuantity) {
                    if (!this.thresholds.length) {
                        throw new ConditionedPricingError("No threshold are set", "_Invalid Conditioned Pricing : No threshold");
                    }
                    if (itemQuantity <= 0) {
                        return new Sys.Decimal(0);
                    }
                    var thresholdsInf = this.thresholds.filter(function (thrld) { return thrld.threshold.lessThanOrEqualTo(itemQuantity); });
                    var threshold = thresholdsInf[thresholdsInf.length - 1];
                    return new Sys.Decimal(itemQuantity)
                        .sub(threshold.threshold)
                        .mul(threshold.unitPrice)
                        .add(threshold.base);
                };
                CConditionedPricing.prototype.ToData = function () {
                    return {
                        type: this.type,
                        thresholds: this.thresholds.map(function (_a) {
                            var threshold = _a.threshold, unitPrice = _a.unitPrice, base = _a.base;
                            return ({
                                threshold: threshold.toNumber(),
                                unitPrice: unitPrice.toNumber(),
                                base: base.toNumber()
                            });
                        })
                    };
                };
                CConditionedPricing.prototype.GetFirstThresholdUnitPrice = function () {
                    return this.thresholds[0].unitPrice;
                };
                return CConditionedPricing;
            }());
            ConditionedPricing.CConditionedPricing = CConditionedPricing;
            var CVolumePricing = /** @class */ (function (_super) {
                __extends(CVolumePricing, _super);
                function CVolumePricing() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.type = Type.VolumePricing;
                    return _this;
                }
                CVolumePricing.prototype.ComputeThresholdsBase = function () {
                    this.thresholds = this.thresholds
                        .map(function (threshold) { return ({
                        unitPrice: threshold.unitPrice,
                        base: threshold.unitPrice.mul(threshold.threshold),
                        threshold: threshold.threshold
                    }); });
                };
                return CVolumePricing;
            }(CConditionedPricing));
            Factory.factories[Type.VolumePricing] = function () { return new CVolumePricing(); };
            var CTieredPricing = /** @class */ (function (_super) {
                __extends(CTieredPricing, _super);
                function CTieredPricing() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.type = Type.TieredPricing;
                    return _this;
                }
                CTieredPricing.prototype.ComputeThresholdsBase = function () {
                    var genericThresholds = [];
                    var sumOldPrice = new Sys.Decimal(0);
                    var prevThreshold;
                    var currThreshold;
                    for (var i = 0; i < this.thresholds.length; i++) {
                        currThreshold = this.thresholds[i];
                        if (!prevThreshold) {
                            sumOldPrice = currThreshold.threshold.mul(currThreshold.unitPrice);
                        }
                        else {
                            sumOldPrice = sumOldPrice.add(currThreshold.threshold.minus(prevThreshold.threshold).mul(prevThreshold.unitPrice));
                        }
                        genericThresholds.push({
                            unitPrice: currThreshold.unitPrice,
                            base: sumOldPrice,
                            threshold: currThreshold.threshold
                        });
                        prevThreshold = currThreshold;
                    }
                    this.thresholds = genericThresholds;
                };
                return CTieredPricing;
            }(CConditionedPricing));
            Factory.factories[Type.TieredPricing] = function () { return new CTieredPricing(); };
            var COveragePricing = /** @class */ (function (_super) {
                __extends(COveragePricing, _super);
                function COveragePricing() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.type = Type.OveragePricing;
                    return _this;
                }
                // eslint-disable-next-line class-methods-use-this
                COveragePricing.prototype.ValidateInputBase = function (input) {
                    var base = parseFloat(input.base);
                    if (isNaN(base) || base < 0) {
                        throw new ThresholdsError("Invalid base", "_Invalid Conditioned Pricing : invalid base");
                    }
                    return new Sys.Decimal(base);
                };
                COveragePricing.prototype.ComputeThresholdsBase = function () {
                };
                return COveragePricing;
            }(CConditionedPricing));
            Factory.factories[Type.OveragePricing] = function () { return new COveragePricing(); };
            var CUniquePricing = /** @class */ (function (_super) {
                __extends(CUniquePricing, _super);
                function CUniquePricing() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.type = Type.UniquePricing;
                    return _this;
                }
                // eslint-disable-next-line class-methods-use-this
                CUniquePricing.prototype.ValidateInputThreshold = function (input) {
                    return new Sys.Decimal(0);
                };
                CUniquePricing.prototype.SetThresholds = function (thresholds, noCheck) {
                    if (noCheck === void 0) { noCheck = false; }
                    if (!noCheck) {
                        if (thresholds.length != 1) {
                            throw new ThresholdsError("Invalid threshold", "_Invalid Conditioned Pricing : one threshold expected");
                        }
                    }
                    _super.prototype.SetThresholds.call(this, thresholds, noCheck);
                };
                CUniquePricing.prototype.ComputeThresholdsBase = function () {
                    var uniqueThreshold = this.thresholds[0];
                    this.thresholds = [{
                            base: new Sys.Decimal(0),
                            unitPrice: uniqueThreshold.unitPrice,
                            threshold: new Sys.Decimal(0)
                        }];
                };
                return CUniquePricing;
            }(CConditionedPricing));
            Factory.factories[Type.UniquePricing] = function () { return new CUniquePricing(); };
        })(ConditionedPricing = Purchasing.ConditionedPricing || (Purchasing.ConditionedPricing = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
