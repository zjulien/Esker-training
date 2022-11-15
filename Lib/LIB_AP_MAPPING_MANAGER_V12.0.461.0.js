/* LIB_DEFINITION{
  "name": "Lib_AP_Mapping_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Sys/Sys_Helpers_Object"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * Use the mapping manager to register mappers. A mapper allows to map an input file format (e.g. UBL, EDI) to the fields of a process (e.g. Vendor invoice).
        * You can then get the relevant mapper for a given input file.
        * You can create your own mapper for a specific input file format.
        * The mappers registers themselves by calling <code>Lib.AP.MappingManager.Register(MyMapper);</code>: See {@link Lib.AP.MappingUBL} for an example.
        * @namespace Lib.AP.MappingManager
        */
        var MappingManager;
        (function (MappingManager) {
            /** @lends Lib.AP.MappingManager */
            var Mappers = [];
            MappingManager.CurrentMapperDocument = null;
            /**
            * Register a mapper
            * @param {Object} mapper The mapper to register
            * @see {@link Lib.AP.MappingUBL}
            **/
            function Register(mapper) {
                if (mapper) {
                    Mappers.push(mapper);
                }
            }
            MappingManager.Register = Register;
            /**
            * Get the corresponding mapper for a given input file
            * @param {String} fileContent The content of the input file
            * @returns {Object} The corresponding mapper
            * @see {@link Lib.AP.MappingUBL}
            **/
            function GetMapper(fileContent) {
                if (typeof fileContent === "string") {
                    for (var mapperIndex = 0; mapperIndex < Mappers.length; mapperIndex++) {
                        var mapper = Mappers[mapperIndex];
                        if (typeof mapper.IsMyType === "function") {
                            if (mapper.IsMyType(fileContent) === true) {
                                return mapper;
                            }
                        }
                    }
                }
                return null;
            }
            MappingManager.GetMapper = GetMapper;
            /**
            * Set a mapper document as the current one. See {@link Lib.AP.MappingUBL.InvoiceDocument} for an example.
            * @param {Object} mapperDocument A mapper document object
            **/
            function SetCurrentMapperDocument(mapperDocument) {
                // For legacy mappers
                if (!(mapperDocument instanceof Lib.AP.Mapping.InvoiceDocument)) {
                    var propertyNames = Object.getOwnPropertyNames(Lib.AP.Mapping.InvoiceDocument.prototype);
                    for (var i = 0; i < propertyNames.length; i++) {
                        mapperDocument[propertyNames[i]] = mapperDocument[propertyNames[i]] || Lib.AP.Mapping.InvoiceDocument.prototype[propertyNames[i]];
                    }
                }
                MappingManager.CurrentMapperDocument = mapperDocument;
            }
            MappingManager.SetCurrentMapperDocument = SetCurrentMapperDocument;
        })(MappingManager = AP.MappingManager || (AP.MappingManager = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
