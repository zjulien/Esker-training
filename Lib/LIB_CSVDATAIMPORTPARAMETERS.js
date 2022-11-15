/* LIB_DEFINITION{
  "name": "Lib_CSVDataImportParameters",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Custom library extending Sys_CSVDataImportParameters",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_Helpers_String",
    "Lib_V12.0.461.0",
    "[Lib_AR_CSVDataImportParameters]",
    "[Lib_CM_CSVDataImportParameters]",
    "[Lib_DD_CSVDataImportParameters]",
    "[Lib_P2P_CSVDataImportParameters]",
    "[Lib_SOP_CSVDataImportParameters]"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "CSVDataImportParameters", function ()
{
    return {
        /* ************************************ *
         * List of parameters for configuration *
         * ************************************ */
        LibVersion: 2,
        ERPIndexSeparator: "#",
        Parameters: {
            /* FailureManagementProcessName is the name of the next proccess to call to handle failure */
            //FailureManagementProcessName: "Sys_CSV Data Import Failure Management",

            /* Mapping allow the definition of a relation between the tablename extracted from the CSV filename
             * and a XML mapping file.
             * if nothing defined, the code assume the mapping file is 'mapping_[tablename]__.xml' */
            //Mapping: {
            //Here an exemple to link the input SAP__Vendors__example.csv file to mapping_Vendors__.xml mapping file

            //"Vendors": "mapping_Vendors__.xml"
            //},

            /* FileNamePattern is used to validate the input file format */
            FileNamePattern: ".*"
            //CsvHasHeader: true,

            /* CSV2TAble options*/
            /* possible values:
             * "full" - if the csv represent the whole content of the table
             * "incremental" - if the csv represent a subset of the table */
            //ReplicationMode: "full",
            // ClearTable: false,
            // NoDelete: false,
            // NoUpdate: false,
            // NoInsert: false,

            /* Notification options */
            // NotifyOnSuccess: false,
            // NotifyOnFailure: true,
            // NotifyOnEmptyFile: true,
            // NotifySender: false,
            // NotificationIncludeAttach:true,
            // NotificationBccEmailAddress: "",
            // NotificationEmailAddress:"",
            // NotificationSenderAddress: "",
            // NotificationSenderName: "",
            // NotificationLanguage: "en",
            // SupportedLanguages: ["en", "fr"],

            /* NotificationAttachMaxSizeInBytes limit the size of the CSV input that can be attached to notification email */
            // NotificationAttachMaxSizeInBytes: 7142880,

            /* Notifications contains the text used in send email formated as follow
                Notifications: {
                    // [lg] should be a language code like 'en','fr', ...
                    "[lg]":{
                        subject: {
                            // subject for success email
                            success: "",
                            // subject for failure email
                            failure: ""
                        },
                        message: {
                            // message for success email
                            success: "",
                            // message for failure email when no mapping is found
                            noMapping: "",
                            // message for failure email when the input file is not valid
                            invalidFile: "",
                            // message for failure email when the input file is empty
                            emptyFile:	"",
                            // message for failure email when the command line failed
                            processFailure: ""
                        },
                        footer: {
                            // footer message for email when the csv is not asked to be attached
                            "noAttach": "",
                            // footer message for email when the csv is asked to be attached
                            "withAttach": "",
                            // footer message for email when the csv is asked to be attached but is too big
                            "overSized": ""
                        }
                    },
                }
            */

            // Notifications: {
            // "en":{
            // subject: {
            // success: "[DATA IMPORT SUCCESS] Data Import from '%[FileName]'",
            // failure: "[DATA IMPORT FAILURE] Data Import from '%[FileName]'"
            // },
            // message: {
            // success:	"Dear recipient,\n\n"+
            // "Data from file '%[FileName]' loaded successfully.\n\n"+
            // "TECHNICAL DETAILS:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environment: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifier: %[MSN]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Status: %[ShortStatus]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "%[LongStatus]\n"+
            // "-----------------------------------------------------------------------------",

            // noMapping:  "Dear recipient,\n\n"+
            // "Data from file '%[FileName]' could not be loaded because the mapping file is undefined for table %[TableName].\n\n"+
            // "TECHNICAL DETAILS:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environment: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifier: %[MSN]\n" +
            // "-----------------------------------------------------------------------------",

            // invalidFile:    "Dear recipient,\n\n"+
            // "Data from file '%[FileName]' could not be loaded because no valid table was found.\n\n"+
            // "Please make sure the file name is correct and matches the following format: \"*.csv\"\n\n"+
            // "TECHNICAL DETAILS:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environment: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifier: %[MSN]\n" +
            // "-----------------------------------------------------------------------------",

            // emptyFile:	"Dear recipient,\n\n"+
            // "Data from file '%[FileName]' could not be loaded because the file is empty.\n\n"+
            // "Please verify your CSV file generation process.\n\n"+
            // "TECHNICAL DETAILS:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environment: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifier: %[MSN]\n" +
            // "-----------------------------------------------------------------------------",

            // processFailure: "Dear recipient,\n\n"+
            // "Data from file '%[FileName]' could not be loaded.\n\n"+
            // "Please refer to the 'Log.xml' file attached to this email for details.\n\n"+
            // "TECHNICAL DETAILS:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environment: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifier: %[MSN]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Status: %[ShortStatus]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "%[LongStatus]\n"+
            // "-----------------------------------------------------------------------------"
            // },
            // footer: {
            // "noAttach": "",
            // "withAttach": "\n\nThe submitted file is attached to this email for your reference.",
            // "overSized": "\n\nThe submitted file being over %[NotificationAttachMaxSizeInBytes] Bytes in size, it has not been attached to this email."
            // }
            // },

            // "fr":{
            // subject: {
            // success: "[SUCCES DE L'IMPORT DE DONNEES] Import de données depuis '%[FileName]'",
            // failure: "[ECHEC DE L'IMPORT DE DONNEES] Import de données depuis '%[FileName]'"
            // },
            // message: {
            // success:    "Madame, Monsieur,\n\n"+
            // "Les données du fichier '%[FileName]' ont été importées avec succès.\n\n"+
            // "DETAILS TECHNIQUES:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environnement: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifiant: %[MSN]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Statut: %[ShortStatus]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "%[LongStatus]\n"+
            // "-----------------------------------------------------------------------------",

            // noMapping:  "Madame, Monsieur,\n\n"+
            // "Les données du fichier '%[FileName]' n'ont pas pu être chargées car le fichier de mapping n'est pas défini pour la table %[TableName].\n\n"+
            // "DETAILS TECHNIQUES:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environnement: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifiant: %[MSN]\n"+
            // "-----------------------------------------------------------------------------",

            // invalidFile:    "Madame, Monsieur,\n\n"+
            // "Les données du fichier '%[FileName]' n'ont pas pu être chargées car aucune table valide n'a été trouvée.\n\n"+
            // "Merci de vous assurer que le nom du fichier est correct et correspond au format suivant: \"*.csv\"\n\n"+
            // "DETAILS TECHNIQUES:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environnement: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifiant: %[MSN]\n"+
            // "-----------------------------------------------------------------------------",

            // emptyFile:	"Madame, Monsieur,\n\n"+
            // "Les données du fichier '%[FileName]' n'ont pas pu être chargées car le fichier est vide.\n\n"+
            // "Merci de vérifier votre processus de génération du fichier CSV.\n\n"+
            // "DETAILS TECHNIQUES:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environnement: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifiant: %[MSN]\n"+
            // "-----------------------------------------------------------------------------",

            // processFailure: "Madame, Monsieur,\n\n"+
            // "Les données du fichier '%[FileName]' n'ont pas pu être chargées.\n\n"+
            // "Merci de consulter le fichier 'Log.xml' joint à cet email pour plus de détails.\n\n"+
            // "DETAILS TECHNIQUES:\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Environnement: %[Environment]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Identifiant: %[MSN]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "Statut: %[ShortStatus]\n"+
            // "-----------------------------------------------------------------------------\n"+
            // "%[LongStatus]\n"+
            // "-----------------------------------------------------------------------------"
            // },
            // footer: {
            // "noAttach": "",
            // "withAttach": "\n\nPour votre information, le fichier ayant été soumis est joint à cet email.",
            // "overSized": "\n\nLa taille du fichier soumis excède %[NotificationAttachMaxSizeInBytes] Octets. Ce fichier n'a donc pas été joint à cet email."
            // }
            // }
            // }
        },

        /* ********* *
         * Functions *
         * ********* */

        /**
         * Initialize the data
         * @param {string} erpId Id of the ERP
         * returns the name of recognized ERP or empty by default
         */
        Init: function (erpId)
        {
            var csvFileName = Attach.GetName(0);
            var version = this.GetFileNamingVersion();
            if (version === 1 || version === 2)
            {
                Log.Info("File Naming Version " + version + " : <PackageName>__<ERP>__<TableName>__");
                if (csvFileName.startsWith("SOP"))
                {
                    if (typeof Lib !== "undefined" && typeof Lib.SOP !== "undefined" && typeof Lib.SOP.CSVDataImportParameters !== "undefined")
                    {
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, Lib.SOP.CSVDataImportParameters);
                        Log.Info("Init: Lib.CSVDataImportParameters extended with Lib.SOP.CSVDataImportParameters");
                        if (typeof Lib.SOP.CSVDataImportParameters.Init === "function")
                        {
                            return Lib.SOP.CSVDataImportParameters.Init(erpId);
                        }

                        return "";
                    }
                }
                else if (csvFileName.startsWith("P2P"))
                {
                    if (typeof Lib !== "undefined" && typeof Lib.P2P !== "undefined" && typeof Lib.P2P.CSVDataImportParameters !== "undefined")
                    {
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, Lib.P2P.CSVDataImportParameters);
                        Log.Info("Init: Lib.CSVDataImportParameters extended with Lib.P2P.CSVDataImportParameters");
                        if (typeof Lib.P2P.CSVDataImportParameters.Init === "function")
                        {
                            return Lib.P2P.CSVDataImportParameters.Init(erpId);
                        }

                        return "";
                    }
                }
                else if (csvFileName.startsWith("DD"))
                {
                    if (typeof Lib !== "undefined" && typeof Lib.DD !== "undefined" && typeof Lib.DD.CSVDataImportParameters !== "undefined")
                    {
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, Lib.DD.CSVDataImportParameters);
                        Log.Info("Init: Lib.CSVDataImportParameters extended with Lib.DD.CSVDataImportParameters");
                        if (typeof Lib.DD.CSVDataImportParameters.Init === "function")
                        {
                            return Lib.DD.CSVDataImportParameters.Init(erpId);
                        }

                        return "";
                    }
                }
                else if (csvFileName.startsWith("AR"))
                {
                    Log.Info("DEBUG: File starts with AR");
                    if (typeof Lib !== "undefined" && typeof Lib.AR !== "undefined" && typeof Lib.AR.CSVDataImportParameters !== "undefined")
                    {
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, Lib.AR.CSVDataImportParameters);
                        Log.Info("Init: Lib.CSVDataImportParameters extended with Lib.AR.CSVDataImportParameters");
                        if (typeof Lib.AR.CSVDataImportParameters.Init === "function")
                        {
                            return Lib.AR.CSVDataImportParameters.Init(erpId);
                        }

                        return "";
                    }
                }
                else if (csvFileName.startsWith("CM"))
                {
                    Log.Info("DEBUG: File starts with CM");
                    if (typeof Lib !== "undefined" && typeof Lib.CM.CSVDataImportParameters !== "undefined")
                    {
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, Lib.CM.CSVDataImportParameters);
                        Log.Info("Init: Lib.CSVDataImportParameters extended with Lib.CM.CSVDataImportParameters");
                        if (typeof Lib.CM.CSVDataImportParameters.Init === "function")
                        {
                            return Lib.CM.CSVDataImportParameters.Init(erpId);
                        }

                        return "";
                    }
                }

                return "";
            }
            else
                // eslint-disable-next-line no-else-return
            {
                Log.Info("File Naming Version 0");
                if (typeof Lib !== "undefined" && typeof Lib.ERP !== "undefined" && typeof Lib.ERP.CreateManager === "function")
                {
                    var manager = Lib.ERP.CreateManager(erpId);
                    if (manager)
                    {
                        var document = manager.GetDocument("CSV_DATA_IMPORT_PARAMETERS");
                        Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, document);
                        const docProto = Object.getPrototypeOf(document);
                        const propertyNames = Object.getOwnPropertyNames(docProto);
                        for (let i = 0; i < propertyNames.length; i++)
                        {
                            if (propertyNames[i] != "constructor")
                            {
                                Lib.CSVDataImportParameters[propertyNames[i]] = docProto[propertyNames[i]];
                            }
                        }
                        return erpId;
                    }
                }
                return "";
            }
        },

        /* GetJSON:
         * returns the parameters to extends the default parameters
         */
        GetJSON: function ()
        {
            return this.Parameters;
        },

        GetFileNamingVersion: function ()
        {
            var fileName = Attach.GetName(0);
            // Starting with LibVersion = 1, the new naming convention to respect for the CSV file name is <PackageName>__<ERP>__<TableName>__
            // LibVersion = 2 is the same as LibVersion. The ERP Field handles another separator '#' by default to be able to have multiple CSV with different name redirected to the same mapping file. (Example : 'SOP__SAP#AG__Customers__')
            var supportedPackageNames = ["SOP", "P2P", "AR", "DD", "CM"];
            var splittedFileName = fileName.split("__");
            if (Lib.CSVDataImportParameters.LibVersion === 2 && splittedFileName.length === 4 && Lib.CSVDataImportParameters.ERPIndexSeparator !== "")
            {
                var packageName = splittedFileName[0];
                if (supportedPackageNames.indexOf(packageName) > -1)
                {
                    return 2;
                }
            }
            if (Lib.CSVDataImportParameters.LibVersion === 1 && splittedFileName.length === 4)
            {
                var packageName = splittedFileName[0];
                if (supportedPackageNames.indexOf(packageName) > -1)
                {
                    return 1;
                }
            }

            return 0;
        },

        GetIdentifier: function ()
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetIdentifier()");
            return "";
        },

        GetPackageContext: function ()
        {
            var fileName = Attach.GetName(0);
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetPackageContext(" + fileName + ")");
            return Sys.Helpers.String.ExtractAfterUntil(fileName, "", "__");
        },

        // -------
        // Hooks : following functions, if uncommented, will REPLACE the default behavior defined in Sys_CSVDataImportParameters
        //
        // NOTE: don't forget to add a ',' after the GetJSON function if you add a fonction below
        // -------


        // function to determine the ERPID based on the input CSV filename
        GetErpId: function (fileName)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetErpId(" + fileName + ")");
            if (fileName && fileName.length > 0)
            {
                var version = this.GetFileNamingVersion();
                if (version >= 2)
                {
                    var erpId = this.GetRawERPData(fileName, version);
                    erpId = erpId.split(Lib.CSVDataImportParameters.ERPIndexSeparator)[0];
                    return erpId;
                }
                // CSV file naming convention (Version 1), for example: SOP__SAP__Customers__.csv => "SAP"
                // legacy CSV file naming convention (without lib Lib_CSVDataImportParameters.js), for example: SOSAP__Customers__.csv => "SOSAP"
                return this.GetRawERPData(fileName, version);
            }
            return "";
        },

        GetRawERPData: function (fileName, version)
        {
            if (fileName && fileName.length > 0)
            {
                if (version >= 1)
                {

                    return Sys.Helpers.String.ExtractAfterUntil(fileName, "__", "__");
                }
                else
                {
                    return Sys.Helpers.String.ExtractAfterUntil(fileName, "", "__");
                }
            }
            return "";
        },

        // function to determine the table name based on the input CSV filename
        GetTableName: function (fileName)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetTableName(" + fileName + ")");
            if (fileName && fileName.length > 0)
            {
                var version = this.GetFileNamingVersion();
                if (version >= 1)
                {
                    // CSV file naming convention (Version 1), for example: SOP__SAP__Customers__20191224112000.csv => "Customers"
                    // new CSV file naming convention (Version 2), for example: SOP__SAP#AG__Customers__20191224112000.csv => "Customers". Retrocompatible with version 1 names.
                    var erpId = this.GetRawERPData(fileName, version);
                    return Sys.Helpers.String.ExtractAfterUntil(fileName, erpId + "__", "__");
                }
                // legacy CSV file naming convention (without lib Lib_CSVDataImportParameters.js), for example: SOSAP__Customers__.csv => "Customers"
                return Sys.Helpers.String.ExtractAfterUntil(fileName, "__", "__");
            }
            return "";
        },

        // function to determine the mapping file base on the table name
        GetMappingFile: function (tableName)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetMappingFile(" + tableName + ")");
            var mapping = "";
            if (tableName)
            {
                mapping = Sys.CSVDataImportParameters.GetExtendedJSON().Mapping[tableName];
                if (!mapping)
                {
                    var version = this.GetFileNamingVersion();
                    if (version >= 1)
                    {
                        // CSV file naming convention (Version 1), for example: SOP__SAP__Customers__20191224112000.csv => "mapping_SOP_SAP_Customers__.xml"
                        // new CSV file naming convention (Version 2), for example: SOP__SAP#AG__Customers__20191224112000.csv => "mapping_SOP_SAP_Customers__.xml". Retrocompatible with version 1 names.
                        mapping = "mapping_" + this.GetPackageContext() + "_" + this.GetErpId(Attach.GetName(0)) + "_" + tableName + "__.xml";
                    }
                    else
                    {
                        // legacy CSV file naming convention (without lib Lib_CSVDataImportParameters.js), for example: SOSAP__Customers__.csv => "mapping_Customers__.xml"
                        mapping = "mapping_" + tableName + "__.xml";
                    }
                }
            }
            return mapping;
        },

        /*
        // Getters for notification

        // return the notification subject based on type and language
        GetNotificationSubject: function (filename, type, lg)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationSubject("+filename+", "+type+", "+lg+")");
            var subject = Sys.CSVDataImportParameters.GetNotification(lg,"subject",type);
            if (!subject)
            {
                subject = Sys.CSVDataImportParameters.GetNotification(lg, "subject", this.SubjectType.failure);
            }
            subject = subject.replace("%[FileName]", filename);
            return subject;
        },

        // return the notification footer message based on the language
        GetNotificationFooter: function(lg)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationFooter("+lg+")");
            if (Sys.CSVDataImportParameters.GetValue("NotificationIncludeAttach"))
            {
                var maxSize = Sys.CSVDataImportParameters.GetValue("NotificationAttachMaxSizeInBytes");
                if (Attach.GetSize(0) > parseInt(maxSize,10))
                {
                    var footer = Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.overSized);
                    if (footer)
                    {
                        footer = footer.replace("%[NotificationAttachMaxSizeInBytes]", maxSize);
                    }
                    return footer;
                }
                return Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.withAttach);
            }
            return Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.noAttach);
        },

        // return the notification message content based on type and language
        GetNotificationMessage: function (filename, environment, tableName, msnEx, type, lg)
        {
            Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationMessage("+tableName+", "+ environment+", "+tableName+", "+ msnEx + ", "+type+", "+lg+")");
            var message = Sys.CSVDataImportParameters.GetNotification(lg, "message", type);
            if (!message)
            {
                message = Sys.CSVDataImportParameters.GetNotification(lg, "message", Sys.CSVDataImportParameters.MessageType.processFailure);
            }

            message = message.replace("%[FileName]", filename);
            message = message.replace("%[Environment]", environment);
            message = message.replace("%[TableName]", tableName);
            message = message.replace("%[MSN]", msnEx);
            message += Sys.CSVDataImportParameters.GetNotificationFooter(lg);
            return message;
        }
        */

        /**
         * Get the reference file name to use with the CSV Import command line.<br/><br/>
         * <i>this function could be overridden by the function <b>GetReferenceFileName(tableName, erpId)</b> of the custom library 'Lib.CSVDataImportParameters'.</i>
         *
         * @public
         * @param {string} tableName - table name to be replaced in message
         * @param {string} erpId - identifier of the ERP
         * @return {string} returns the query filter used to clear the table before import CSV
         */
        GetReferenceFileName: function (tableName, erpId)
        {
            var version = this.GetFileNamingVersion();
            if (version >= 2)
            {
                return "%Misc%\\DO_NOT_DELETE_RefCSV_" + this.GetRawERPData(Attach.GetName(0), version) + "_" + tableName + ".csv";
            }
            else
            {
                return "%Misc%\\DO_NOT_DELETE_RefCSV_" + erpId + "_" + tableName + ".csv";
            }
        }
    };
});
