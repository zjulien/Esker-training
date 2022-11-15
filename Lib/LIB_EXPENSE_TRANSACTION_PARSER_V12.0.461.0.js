///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Parser_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction parser interface definition",
  "require": [
    "Sys/Sys_Helpers_Object",
    "Lib_Expense_Transaction_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Parser;
            (function (Parser) {
                //#region Parsing Errors
                //Generic Parsing Error
                var ParsingError = /** @class */ (function (_super) {
                    __extends(ParsingError, _super);
                    /**
                     * Use this error if no other error type corresponding
                     * @param message Message of the error already translate
                     */
                    function ParsingError(message) {
                        var _this = _super.call(this, message) || this;
                        Sys.Helpers.Object.SetPrototypeOf(_this, ParsingError.prototype);
                        return _this;
                    }
                    return ParsingError;
                }(Error));
                Parser.ParsingError = ParsingError;
                var TransactionLineError = /** @class */ (function (_super) {
                    __extends(TransactionLineError, _super);
                    /**
                     * Throw this error when the structure of a line is not correct
                     * (Ex : line length)
                     * @param message Language key for the message or falsy value to use default one
                     * @param onTransactionLine Transaction line number
                     */
                    function TransactionLineError(message, onTransactionLine) {
                        var _this = this;
                        var messageToUse = message ? message : TransactionLineError.defaultMessage;
                        _this = _super.call(this, Language.Translate(messageToUse, false, onTransactionLine)) || this;
                        _this._message = messageToUse;
                        _this._onTransactionLine = onTransactionLine;
                        Sys.Helpers.Object.SetPrototypeOf(_this, TransactionLineError.prototype);
                        return _this;
                    }
                    TransactionLineError.defaultMessage = "_DefaultTransactionLineErrorMessage";
                    return TransactionLineError;
                }(ParsingError));
                Parser.TransactionLineError = TransactionLineError;
                var SyntaxError = /** @class */ (function (_super) {
                    __extends(SyntaxError, _super);
                    /**
                     * Throw this error in your parsers when
                     * Characters read are not as expected
                     * (Ex : expected "+" or "-" and get "a")
                     * @param message Language key for the traduction with {0},{1}, ... {n} or falsy value to use default one
                     * @param fieldName Name of field that you currently trying to extract
                     * @param gettingValues values found
                     * @param expectedValues values expected
                     */
                    function SyntaxError(message, onTransactionLine, fieldName, gettingValues, expectedValues) {
                        var _this = this;
                        var messageToUse = message ? message : SyntaxError.defaultMessage;
                        _this = _super.call(this, Language.Translate(messageToUse, false, fieldName, gettingValues, expectedValues, onTransactionLine)) || this;
                        _this._message = messageToUse;
                        _this._fieldName = fieldName;
                        _this._gettingValues = gettingValues;
                        _this._expectedValues = expectedValues;
                        Sys.Helpers.Object.SetPrototypeOf(_this, SyntaxError.prototype);
                        return _this;
                    }
                    SyntaxError.defaultMessage = "_DefaultSyntaxErrorMessage";
                    return SyntaxError;
                }(ParsingError));
                Parser.SyntaxError = SyntaxError;
                var ConversionError = /** @class */ (function (_super) {
                    __extends(ConversionError, _super);
                    /**
                     * Throw this error in your parsers when you cannot
                     * apply mathematic/date conversion
                     * (Ex: Obtain not valid date 29 of february or try something wrong divide by 0)
                     * @param message Language key for the traduction with {0},{1}, ... {n} or falsy value to use default one
                     * @param fieldName Name of field that you currently trying to extract
                     * @param operation Operation, function that returns or failed
                     * @param resultIfAny result of the operation or function
                     * @param withArgs array of args use to perform operation (join with , in the language key)
                     */
                    function ConversionError(message, onTransactionLine, fieldName, operation, resultIfAny) {
                        var withArgs = [];
                        for (var _i = 5; _i < arguments.length; _i++) {
                            withArgs[_i - 5] = arguments[_i];
                        }
                        var _this = this;
                        var messageToUse = message ? message : ConversionError.defaultMessage;
                        _this = _super.call(this, Language.Translate(messageToUse, false, fieldName, operation, resultIfAny !== null && resultIfAny !== void 0 ? resultIfAny : "", withArgs.join(","), onTransactionLine)) || this;
                        _this._resultIfAny = resultIfAny;
                        _this._message = messageToUse;
                        _this._fieldName = fieldName;
                        _this._operation = operation;
                        _this._withArgs = withArgs;
                        Sys.Helpers.Object.SetPrototypeOf(_this, ConversionError.prototype);
                        return _this;
                    }
                    ConversionError.defaultMessage = "_DefaultConversionErrorMessage";
                    return ConversionError;
                }(ParsingError));
                Parser.ConversionError = ConversionError;
                //#endregion
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
