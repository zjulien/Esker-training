/* LIB_DEFINITION{
  "name": "Lib_Expense_InboundChannelPreprocessing",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Inbound channel preprocessing library",
  "versionable": false,
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LDAPUtil",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var InboundChannelPreprocessing;
        (function (InboundChannelPreprocessing) {
            var StandardUserLookup = /** @class */ (function () {
                function StandardUserLookup(environment) {
                    this.environment = null;
                    this.environment = environment;
                }
                StandardUserLookup.prototype.Search = function (filter) {
                    filter =
                        Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ENVIRONMENT", this.environment), // ignore vendor in vendor portal
                        Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ACCOUNTLOCKED", "0"), // don't pick up user locked by admin
                        Sys.Helpers.LdapUtil.FilterNotExist("ACCOUNTLOCKED")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ISGROUP", "0"), // ignore groups
                        Sys.Helpers.LdapUtil.FilterNotExist("ISGROUP")), Sys.Helpers.LdapUtil.FilterEqual("VENDOR", "0"), // ignore vendor in vendor portal
                        Sys.Helpers.LdapUtil.FilterEqual("CUSTOMER", "0"), // ignore customer in customer portal
                        Sys.Helpers.LdapUtil.FilterEqual("TECHNICAL", "0"), // ignore super users
                        filter);
                    Log.Info("StandardUserLookup " + filter);
                    var queryOptions = {
                        table: "ODUSER",
                        filter: filter.toString(),
                        attributes: ["LOGIN"],
                        maxRecords: 2,
                        additionalOptions: {
                            queryOptions: "FastSearch=1"
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(queryOptions);
                };
                return StandardUserLookup;
            }());
            InboundChannelPreprocessing.functions = {
                "Preprocessing for Expense creation": function (inputJSON) {
                    Log.Info("Preprocessing for Expense creation");
                    // User lookup with FromAddress, try matching with login first, then with emailaddress
                    var senderLogin = null;
                    Log.Info("User lookup with " + inputJSON.InboundEmailDetails.FromAddress + " as login...");
                    var environment = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerId")).GetValue("Environment");
                    var userLookup = new StandardUserLookup(environment);
                    var sender = null;
                    userLookup.Search(Sys.Helpers.LdapUtil.FilterEqual("LOGIN", inputJSON.InboundEmailDetails.FromAddress))
                        .Then(function (results) {
                        if (results && results.length > 0) {
                            Log.Info("User found matching login");
                            sender = results[0];
                        }
                    });
                    if (sender) {
                        senderLogin = inputJSON.InboundEmailDetails.FromAddress;
                    }
                    else {
                        Log.Info("User lookup with " + inputJSON.InboundEmailDetails.FromAddress + " as email address (ignoring vendor/customer/technical)...");
                        userLookup.Search(Sys.Helpers.LdapUtil.FilterEqual("EMAILADDRESS", inputJSON.InboundEmailDetails.FromAddress))
                            .Then(function (results) {
                            if (results && results.length > 0) {
                                Log.Info("User found matching email address");
                                if (results.length > 1) {
                                    Log.Warn("More than one user matches email address");
                                }
                                senderLogin = results[0].LOGIN;
                            }
                        });
                    }
                    // Send notification if email sender has not been found
                    if (!senderLogin) // empty string or null
                     {
                        Log.Error("No user found matching sender email address " + inputJSON.InboundEmailDetails.FromAddress);
                        Log.Info("Send notification to user " + inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        var userToNotify = Sys.Helpers.Globals.Users.GetUser(inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        // Notify user if he/she exists
                        if (userToNotify) {
                            var emailToNotify = userToNotify.GetValue("EmailAddress");
                            var templateName = "Expense_Email_BadSenderFromInboundChannel.htm";
                            var notificationVars = {
                                NotifyFilter: "(state=200)",
                                NotifyAddressType: "SM",
                                NotifyTemplateFile: templateName,
                                NotifyTemplateOwnerID: userToNotify.GetValue("FullDn"),
                                NotifyAddress: emailToNotify,
                                OwnerId: Data.GetValue("OwnerId"),
                                FromName: "Esker Expense Management",
                                FromAddress: "notification@eskerondemand.com",
                                "CustomTag-SenderAddress": inputJSON.InboundEmailDetails.FromAddress,
                                "CustomTag-ValidationUrl": Data.GetValue("ValidationUrl")
                            };
                            Process.AddNotification(notificationVars);
                        }
                        else {
                            Log.Error("User to notify not found or not set: " + inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        }
                        //Put in failed mode
                        Data.SetValue("State", 200);
                        Variable.SetValueAsString("ErrorSenderUnknown", "1");
                        return null;
                    }
                    // Update transports
                    for (var process in inputJSON.transports) {
                        var transport = inputJSON.transports[process];
                        Log.Info("Change ownerLogin from " + transport.ownerLogin + " to " + senderLogin);
                        transport.ownerLogin = senderLogin;
                        for (var attach in transport.attachments) {
                            var attachment = transport.attachments[attach];
                            var vars = attachment.vars;
                            var fileAttached = attachment.attachFile;
                            var fileExtension = fileAttached.split('.').pop().toLowerCase();
                            if ((fileExtension === 'jpg' || fileExtension === 'jpeg') && vars.AttachOutputFormat === ".pdf") {
                                vars.AttachOutputFormat = ""; // don't set explicit conversion format in order to use default expense converter
                            }
                        }
                    }
                    return inputJSON;
                }
            };
        })(InboundChannelPreprocessing = Expense.InboundChannelPreprocessing || (Expense.InboundChannelPreprocessing = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
