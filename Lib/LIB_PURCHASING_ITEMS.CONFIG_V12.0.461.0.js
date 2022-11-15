///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Items.Config_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing_Items. Mapping/config objects used to manage items in purchasing",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Parameters",
    "Sys/Sys_TechnicalData",
    "Lib_Purchasing.Base_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Items;
        (function (Items) {
            function InitDBFieldsMap(dbInfo) {
                dbInfo.fieldsMap = dbInfo.fields.reduce(function (ret, field) {
                    if (Sys.Helpers.IsPlainObject(field) && Sys.Helpers.IsString(field.name)) {
                        if (!field.foreign) {
                            ret[field.name] = field.type || "string";
                        }
                    }
                    else if (Sys.Helpers.IsString(field)) {
                        ret[field] = "string";
                    }
                    return ret;
                }, {});
                return dbInfo.fieldsMap;
            }
            Items.InitDBFieldsMap = InitDBFieldsMap;
            Items.PRItemsDBInfo = {
                "docType": "PR",
                "table": "PAC - PR - Items__",
                "lineKey": ["PRNumber__", "LineNumber__"],
                "fields": [
                    "CompanyCode__",
                    "PRNumber__",
                    { "name": "LineNumber__", "type": "int" },
                    "Status__",
                    "ItemType__",
                    "CatalogReference__",
                    "SupplierPartID__",
                    "Description__",
                    "CostCenterName__",
                    "CostCenterId__",
                    "ProjectCode__",
                    "ProjectCodeDescription__",
                    "WBSElement__",
                    "WBSElementID__",
                    "InternalOrder__",
                    { "name": "Quantity__", "type": "double" },
                    { "name": "CanceledQuantity__", "type": "double" },
                    { "name": "OrderedQuantity__", "type": "double" },
                    { "name": "ReceivedQuantity__", "type": "double" },
                    { "name": "ReturnedQuantity__", "type": "double" },
                    "Currency__",
                    { "name": "ExchangeRate__", "type": "double" },
                    "TaxCode__",
                    { "name": "TaxRate__", "type": "double" },
                    { "name": "NonDeductibleTaxRate__", "type": "double" },
                    { "name": "UnitPrice__", "type": "double" },
                    { "name": "PublicPrice__", "type": "double" },
                    { "name": "NetAmount__", "type": "double" },
                    { "name": "CanceledAmount__", "type": "double" },
                    { "name": "ItemOrderedAmount__", "type": "double" },
                    { "name": "ItemReceivedAmount__", "type": "double" },
                    "CostType__",
                    "GLAccount__",
                    "Group__",
                    "VendorName__",
                    "VendorNumber__",
                    { "name": "StartDate__", "type": "date" },
                    { "name": "EndDate__", "type": "date" },
                    { "name": "RequestedDeliveryDate__", "type": "date" },
                    { "name": "RequestedDeliveryDateInPast__", "type": "bool" },
                    "SupplyTypeName__",
                    "SupplyTypeId__",
                    "SupplyTypeFullPath__",
                    "PurchasingGroup__",
                    "PurchasingOrganization__",
                    "DeliveryAddressID__",
                    "ShipToAddress__",
                    "ShipToCompany__",
                    "ShipToContact__",
                    "ShipToEmail__",
                    "ShipToPhone__",
                    { "name": "CompletelyOrdered__", "type": "bool" },
                    "RequesterDN__",
                    "BuyerDN__",
                    "BuyerLogin__",
                    "RecipientDN__",
                    "PRRUIDEX__",
                    "BudgetID__",
                    "ItemInCxml__",
                    "Reason__",
                    "ItemUnit__",
                    "ItemUnitDescription__",
                    { "name": "NoGoodsReceipt__", "type": "bool" },
                    { "name": "NotifyRequesterOnReceipt__", "type": "bool" },
                    { "name": "Locked__", "type": "bool" },
                    "LeadTime__",
                    { "name": "ShipToAddress", "TechnicalData": true },
                    { "name": "PRSubmissionDateTime__", "type": "date" },
                    "FreeDimension1__",
                    "FreeDimension1ID__",
                    { "name": "IsReplenishmentItem__", "type": "bool" },
                    "WarehouseID__",
                    "WarehouseName__",
                    "ContractRUIDEX__",
                    "ContractNumber__",
                    "ContractName__"
                ]
            };
            InitDBFieldsMap(Items.PRItemsDBInfo);
            Items.PRItemsSynchronizeConfig = {
                "tableKey": "PRNumber__",
                "ParentRuidKey": "PRRUIDEX__",
                "lineKey": "LineNumber__",
                "dbInfo": Items.PRItemsDBInfo,
                "formTable": "LineItems__",
                "computedData": null,
                "mappings": {
                    "common": {
                        "PRSubmissionDateTime__": "PRSubmissionDateTime__",
                        "CompanyCode__": "CompanyCode__",
                        "PRNumber__": "RequisitionNumber__",
                        "PurchasingGroup__": "PurchasingGroup__",
                        "PurchasingOrganization__": "PurchasingOrganization__",
                        "ShipToContact__": "ShipToContact__",
                        "ShipToEmail__": "ShipToEmail__",
                        "ShipToPhone__": "ShipToPhone__",
                        "RequesterDN__": { "name": "RequesterDN", "computed": true },
                        "PRRUIDEX__": "RUIDEX",
                        "Reason__": "Reason__",
                        "TechnicalData__": "TechnicalData__"
                    },
                    "byLine": {
                        /**
                         *
                         * Don't forget to add your trad when you add this option "availableOnWorkflowRule"
                         * with this format: PRV2-LineItems__.[YourField__] on this file "Worflow Designer\Workflow Rule\lg"
                         *
                         */
                        "LineNumber__": "LineItemNumber__",
                        "Currency__": "ItemCurrency__",
                        "ExchangeRate__": { "name": "ExchangeRate", "computed": true },
                        "ItemType__": "ItemType__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "CostCenterId__": { "name": "ItemCostCenterId__", "availableOnWorkflowRule": true },
                        "ProjectCode__": { "name": "ProjectCode__", "availableOnWorkflowRule": true },
                        "ProjectCodeDescription__": { "name": "ProjectCodeDescription__" },
                        "WBSElement__": { "name": "WBSElement__", "availableOnWorkflowRule": true },
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": { "name": "InternalOrder__", "availableOnWorkflowRule": true },
                        "Quantity__": "ItemQuantity__",
                        "CanceledQuantity__": "CanceledQuantity__",
                        "OrderedQuantity__": "ItemOrderedQuantity__",
                        "ReceivedQuantity__": "ItemDeliveredQuantity__",
                        "ReturnedQuantity__": "ItemReturnedQuantity__",
                        "Status__": "ItemStatus__",
                        "CompletelyOrdered__": { "name": "CompletelyOrdered", "computed": true },
                        "TaxCode__": { "name": "ItemTaxCode__", "availableOnWorkflowRule": true },
                        "TaxRate__": "ItemTaxRate__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "NetAmount__": "ItemNetAmount__",
                        "CanceledAmount__": "CanceledAmount__",
                        "ItemOrderedAmount__": "ItemOrderedAmount__",
                        "ItemReceivedAmount__": "ItemReceivedAmount__",
                        "CostType__": { "name": "CostType__", "availableOnWorkflowRule": true },
                        "GLAccount__": { "name": "ItemGLAccount__", "availableOnWorkflowRule": true },
                        "Group__": { "name": "ItemGroup__", "availableOnWorkflowRule": true },
                        "VendorName__": "VendorName__",
                        "VendorNumber__": "VendorNumber__",
                        "BuyerDN__": { "name": "BuyerDN", "computed": true },
                        "BuyerLogin__": "BuyerLogin__",
                        "RecipientDN__": { "name": "RecipientDN", "computed": true },
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeId__": "SupplyTypeID__",
                        "SupplyTypeFullPath__": "SupplyTypeFullPath__",
                        "StartDate__": "ItemStartDate__",
                        "EndDate__": "ItemEndDate__",
                        "RequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "RequestedDeliveryDateInPast__": "RequestedDeliveryDateInPast__",
                        "BudgetID__": "BudgetID__",
                        "ItemInCxml__": "ItemInCxml__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "Locked__": "Locked__",
                        "LeadTime__": "LeadTime__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "FreeDimension1__": { "name": "FreeDimension1__", "availableOnWorkflowRule": true },
                        "FreeDimension1ID__": { "name": "FreeDimension1ID__", "availableOnWorkflowRule": true },
                        "IsReplenishmentItem__": {
                            "name": "IsReplenishmentItem__",
                            "availableOnWorkflowRule": true
                        },
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__"
                    }
                }
            };
            Items.PRItemsBrowseDisplayedColumns = [
                { id: "PRNumber__", label: "_PRNumber", type: "STR", width: 100 },
                { id: "LineNumber__", label: "_LineNumber", type: "STR", width: 80 },
                { id: "Description__", label: "_ItemDescription", type: "STR", width: 260 },
                { id: "RequestedDeliveryDate__", label: "_ItemRequestedDeliveryDate", type: "DATE", width: 80 },
                { id: "Quantity__", label: "_ItemRequestedQuantity", type: "INTEGER", width: 50 },
                { id: "OrderedQuantity__", label: "_Ordered quantity", type: "INTEGER", width: 50 },
                { id: "UnitPrice__", label: "_Item unit price", type: "DECIMAL", width: 70 },
                { id: "NetAmount__", label: "_Item net amount", type: "DECIMAL", width: 70 },
                { id: "ItemOrderedAmount__", label: "_ItemOrderedAmount", type: "INTEGER", width: 50 }
            ];
            Items.PRItemsToPRICanceler = {
                "dbInfo": Items.PRItemsDBInfo,
                "formTable": "LineItems__",
                "errorMessages": {},
                "mappings": {
                    "common": {},
                    "byLine": {
                        "PRRUIDEX__": "PRRUIDEX__",
                        "PRNumber__": "PRNumber__",
                        "LineNumber__": "PRLineNumber__",
                        "Description__": "Description__",
                        "Quantity__": "RequestedQuantity__",
                        "UnitPrice__": "UnitPrice__",
                        "NetAmount__": "NetAmount__",
                        "RequesterDN__": "RequesterDN__",
                        "RequestedDeliveryDate__": "RequestedDeliveryDate__",
                        "ItemType__": "ItemType__"
                    }
                }
            };
            Items.POItemsDBInfo = {
                "docType": "PO",
                "table": "PAC - PO - Items__",
                "lineKey": ["PONumber__", "LineNumber__"],
                "fields": [
                    "PONumber__",
                    { "name": "LineNumber__", "type": "int" },
                    "PRNumber__",
                    { "name": "PRLineNumber__", "type": "int" },
                    "Status__",
                    "CompanyCode__",
                    "CatalogReference__",
                    "SupplierPartID__",
                    "Description__",
                    "CostCenterName__",
                    "CostCenterId__",
                    "ProjectCode__",
                    "WBSElement__",
                    "WBSElementID__",
                    "InternalOrder__",
                    "ProjectCodeDescription__",
                    { "name": "OrderedQuantity__", "type": "double" },
                    { "name": "ReceivedQuantity__", "type": "double" },
                    { "name": "ReturnedQuantity__", "type": "double" },
                    "Currency__",
                    "TaxCode__",
                    { "name": "TaxRate__", "type": "double" },
                    { "name": "NonDeductibleTaxRate__", "type": "double" },
                    { "name": "UnitPrice__", "type": "double" },
                    { "name": "PublicPrice__", "type": "double" },
                    { "name": "NetAmount__", "type": "double" },
                    { "name": "ItemReceivedAmount__", "type": "double" },
                    "CostType__",
                    "GLAccount__",
                    "VendorName__",
                    "VendorNumber__",
                    { "name": "StartDate__", "type": "date" },
                    { "name": "EndDate__", "type": "date" },
                    { "name": "RequestedDeliveryDate__", "type": "date" },
                    { "name": "RequestedDeliveryDateInPast__", "type": "bool" },
                    { "name": "DeliveryDate__", "type": "date" },
                    "SupplyTypeName__",
                    "SupplyTypeId__",
                    { "name": "CompletelyDelivered__", "type": "bool" },
                    "RequesterDN__",
                    "BuyerDN__",
                    "RecipientDN__",
                    "RecipientLogin__",
                    "PRRUIDEX__",
                    "PORUIDEX__",
                    "Group__",
                    "BudgetID__",
                    { "name": "ExchangeRate__", "type": "double" },
                    "ItemUnit__",
                    "ItemUnitDescription__",
                    "ItemType__",
                    { "name": "NoGoodsReceipt__", "type": "bool" },
                    { "name": "NotifyRequesterOnReceipt__", "type": "bool" },
                    { "name": "ItemRequestedAmount__", "type": "double" },
                    { "name": "PRSubmissionDateTime__", "type": "date" },
                    "FreeDimension1__",
                    "FreeDimension1ID__",
                    "ShipToCompany__",
                    "DeliveryAddressID__",
                    "ShipToAddress__",
                    "ShipToContact__",
                    { "name": "IsReplenishmentItem__", "type": "bool" },
                    "IsInternal__",
                    "WarehouseID__",
                    "WarehouseName__",
                    "ContractRUIDEX__",
                    "ContractNumber__",
                    "ContractName__"
                ]
            };
            InitDBFieldsMap(Items.POItemsDBInfo);
            Items.GRItemsCDL = {
                "docType": "GR",
                "table": "CDLNAME#Goods receipt V2.LineItems__",
                "lineKey": ["GRNumber__", "LineNumber__"],
                "fields": [
                    { "name": "Line_LineNumber__", "type": "int" },
                    "GRNumber__",
                    "DeliveryNote__",
                    "Line_RecipientDN__",
                    "Line_RecipientName__",
                    "Line_Number__",
                    "Line_Description__",
                    { "name": "Line_UnitPrice__", "type": "double" },
                    "Line_Currency__",
                    { "name": "Line_ReceivedQuantity__", "type": "double" },
                    "Line_ItemUnit__",
                    "Line_SupplierPartID__",
                    { "name": "Line_ReturnedQuantity__", "type": "double" }
                ]
            };
            Items.POItemsSynchronizeConfig = {
                "tableKey": "PONumber__",
                "lineKey": "LineNumber__",
                "ParentRuidKey": "PORUIDEX__",
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "computedData": null,
                "mappings": {
                    "common": {
                        "PONumber__": "OrderNumber__",
                        "CompanyCode__": "CompanyCode__",
                        "Currency__": "Currency__",
                        "ShipToContact__": "ShipToContact__",
                        "VendorName__": "VendorName__",
                        "VendorNumber__": "VendorNumber__",
                        "PORUIDEX__": "RUIDEX",
                        "IsInternal__": "IsInternal__"
                    },
                    "byLine": {
                        /*PAC PO Items (table) field name: PO items (form) field name */
                        "PRSubmissionDateTime__": "PRSubmissionDateTime__",
                        "PRRUIDEX__": "PRRUIDEX__",
                        "PRNumber__": "PRNumber__",
                        "PRLineNumber__": "PRLineNumber__",
                        "RequesterDN__": "RequesterDN__",
                        "BuyerDN__": "BuyerDN__",
                        "RecipientDN__": "RecipientDN__",
                        "RecipientLogin__": { "name": "RecipientLogin", "computed": true },
                        "LineNumber__": "LineItemNumber__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "StartDate__": "ItemStartDate__",
                        "EndDate__": "ItemEndDate__",
                        "RequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "RequestedDeliveryDateInPast__": "RequestedDeliveryDateInPast__",
                        "CostCenterId__": "ItemCostCenterId__",
                        "ProjectCode__": "ProjectCode__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "OrderedQuantity__": "ItemQuantity__",
                        "ReceivedQuantity__": "ItemTotalDeliveredQuantity__",
                        "ReturnedQuantity__": "ItemReturnQuantity__",
                        "DeliveryDate__": "ItemDeliveryDate__",
                        "Status__": { "name": "Status", "computed": true },
                        "CompletelyDelivered__": "ItemDeliveryComplete__",
                        "TaxCode__": "ItemTaxCode__",
                        "TaxRate__": "ItemTaxRate__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "NetAmount__": "ItemNetAmount__",
                        "ItemReceivedAmount__": "ItemReceivedAmount__",
                        "CostType__": "CostType__",
                        "GLAccount__": "ItemGLAccount__",
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeId__": "SupplyTypeId__",
                        "Group__": "ItemGroup__",
                        "BudgetID__": "BudgetID__",
                        "ExchangeRate__": "ItemExchangeRate__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "ItemType__": "ItemType__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "ItemRequestedAmount__": "ItemRequestedAmount__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__"
                    }
                }
            };
            Items.PRItemsToPO = {
                "dbInfo": Items.PRItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineItemNumber__",
                "errorMessages": {
                    "CompanyCode__": "_Only items from the same company can be selected.",
                    "Currency__": "_Only items with the same currency can be selected."
                    // PurchasingGroup__ and PurchasingOrganization__ are defined by company code
                },
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__",
                        "Currency__": "Currency__",
                        "VendorName__": { "name": "VendorName__", "sectionName": "Vendor" },
                        "VendorNumber__": {
                            "name": "VendorNumber__",
                            "sectionName": "Vendor",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "VendorEmail__": { "name": "VendorEmail__", "sectionName": "Vendor" },
                        "VendorVatNumber__": { "name": "VendorVatNumber__", "sectionName": "Vendor" },
                        "VendorAddress__": { "name": "VendorAddress__", "sectionName": "Vendor" },
                        "WarehouseID__": {
                            "name": "WarehouseID__",
                            "sectionName": "Warehouse",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "WarehouseName__": {
                            "name": "WarehouseName__",
                            "sectionName": "Warehouse",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "PurchasingGroup__": "PurchasingGroup__",
                        "PurchasingOrganization__": "PurchasingOrganization__",
                        "ShipToContact__": { "name": "ShipToContact__", "sectionName": "ShipToContact" },
                        "ShipToEmail__": { "name": "ShipToEmail__", "sectionName": "ShipToContact" },
                        "ShipToPhone__": { "name": "ShipToPhone__", "sectionName": "ShipToContact" },
                        "DeliveryAddressID__": { "name": "DeliveryAddressID__", "sectionName": "ShipTo" },
                        "ShipToAddress__": { "name": "ShipToAddress__", "sectionName": "ShipTo" },
                        "ShipToCompany__": { "name": "ShipToCompany__", "sectionName": "ShipTo" },
                        "ShipToAddress": {
                            "name": "ShipToAddress",
                            "TechnicalData": true,
                            "sectionName": "ShipTo"
                        }
                    },
                    "byLine": {
                        /*PAC PR Items (table) field name: PO items (form) field name */
                        "PRSubmissionDateTime__": "PRSubmissionDateTime__",
                        "CompanyCode__": "ItemCompanyCode__",
                        "Currency__": "ItemCurrency__",
                        "PRNumber__": "PRNumber__",
                        "LineNumber__": "PRLineNumber__",
                        "ExchangeRate__": "ItemExchangeRate__",
                        "ItemType__": "ItemType__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "CostCenterId__": "ItemCostCenterId__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "TaxCode__": "ItemTaxCode__",
                        "TaxRate__": "ItemTaxRate__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "CostType__": "CostType__",
                        "GLAccount__": "ItemGLAccount__",
                        "Group__": "ItemGroup__",
                        "StartDate__": "ItemStartDate__",
                        "EndDate__": "ItemEndDate__",
                        "RequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "RequestedDeliveryDateInPast__": "RequestedDeliveryDateInPast__",
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeFullPath__": "SupplyTypeFullPath__",
                        "SupplyTypeId__": "SupplyTypeId__",
                        "RequesterDN__": "RequesterDN__",
                        "BuyerDN__": "BuyerDN__",
                        "RecipientDN__": "RecipientDN__",
                        "PRRUIDEX__": "PRRUIDEX__",
                        "Status__": "Status__",
                        "BudgetID__": "BudgetID__",
                        "VendorNumber__": "RequestedVendor__",
                        "ItemInCxml__": "ItemInCxml__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "Locked__": "Locked__",
                        "LeadTime__": "LeadTime__",
                        "NetAmount__": "ItemRequestedAmount__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__",
                        "ShipToCompany__": "ItemShipToCompany__"
                    }
                }
            };
            Items.GRItemsDBInfo = {
                "docType": "GR",
                "table": "P2P - Goods receipt - Items__",
                "fields": [
                    "OrderNumber__",
                    { "name": "LineNumber__", "type": "int" },
                    "GRNumber__",
                    "Status__",
                    "RequisitionNumber__",
                    "CompanyCode__",
                    "DeliveryNote__",
                    { "name": "Quantity__", "type": "double" },
                    { "name": "Amount__", "type": "double" },
                    { "name": "ReturnedQuantity__", "type": "double" },
                    { "name": "ReturnedAmount__", "type": "double" },
                    { "name": "InvoicedQuantity__", "type": "double" },
                    { "name": "InvoicedAmount__", "type": "double" },
                    { "name": "DeliveryDate__", "type": "date" },
                    { "name": "DeliveryCompleted__", "type": "bool" },
                    { "name": "ExchangeRate__", "type": "double" },
                    "Currency__",
                    "BudgetID__",
                    "ItemUnit__",
                    "ItemType__",
                    "ItemUnitDescription__",
                    "CostType__",
                    "ProjectCode__",
                    "ProjectCodeDescription__",
                    "WBSElement__",
                    "WBSElementID__",
                    "InternalOrder__",
                    "FreeDimension1__",
                    "FreeDimension1ID__",
                    "IsReplenishmentItem__"
                ]
            };
            InitDBFieldsMap(Items.GRItemsDBInfo);
            Items.GRItemsSynchronizeConfig = {
                "tableKey": "GRNumber__",
                "lineKey": "LineNumber__",
                "dbInfo": Items.GRItemsDBInfo,
                "formTable": "LineItems__",
                "computedData": null,
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__",
                        "DeliveryDate__": "DeliveryDate__",
                        "GRNumber__": "GRNumber__",
                        "DeliveryNote__": "DeliveryNote__"
                    },
                    "byLine": {
                        "RequisitionNumber__": "RequisitionNumber__",
                        "OrderNumber__": "OrderNumber__",
                        "LineNumber__": "LineNumber__",
                        "Quantity__": "ReceivedQuantity__",
                        "Amount__": "NetAmount__",
                        "ReturnedQuantity__": "ReturnedQuantity__",
                        "ReturnedAmount__": "ReturnedAmount__",
                        "InvoicedAmount__": { "name": "InvoicedAmount", "computed": true },
                        "InvoicedQuantity__": { "name": "InvoicedQuantity", "computed": true },
                        "DeliveryCompleted__": "DeliveryCompleted__",
                        "Status__": { "name": "Status", "computed": true },
                        "BudgetID__": "BudgetID__",
                        "ExchangeRate__": "ExchangeRate__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "ItemType__": "ItemType__",
                        "CostType__": "CostType__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__"
                    }
                }
            };
            Items.PickupItemsSynchronizeConfig = {
                "tableKey": "GRNumber__",
                "lineKey": "LineNumber__",
                "dbInfo": Items.GRItemsDBInfo,
                "formTable": "LineItems__",
                "computedData": null,
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__",
                        "DeliveryDate__": "PickupDate__",
                        "GRNumber__": "PickupNumber__"
                    },
                    "byLine": {
                        "RequisitionNumber__": "RequisitionNumber__",
                        "OrderNumber__": "OrderNumber__",
                        "LineNumber__": "LineNumber__",
                        "Quantity__": "PickedUpQuantity__",
                        "Amount__": "NetAmount__",
                        "ReturnedQuantity__": "ReturnedQuantity__",
                        "ReturnedAmount__": "ReturnedAmount__",
                        "DeliveryCompleted__": "PickupCompleted__",
                        "Status__": { "name": "Status", "computed": true },
                        "BudgetID__": "BudgetID__",
                        "ExchangeRate__": "ExchangeRate__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "ItemType__": "ItemType__",
                        "CostType__": "CostType__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__"
                    }
                }
            };
            Items.POItemsToEditPORequest = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineNumber__",
                "errorMessages": {},
                "mappings": {
                    "common": {
                        "PONumber__": "OrderNumber__",
                        "CompanyCode__": "CompanyCode__",
                        "Currency__": "Currency__",
                        "PORUIDEX__": "RUIDEX",
                        "VendorName__": "VendorName__",
                        "VendorNumber__": "VendorNumber__",
                        "ShipToCompany__": "ShipToCompany__"
                    },
                    "byLine": {
                        /*PAC PO Items (table) field name: PO items (form) field name */
                        "PRSubmissionDateTime__": "PRSubmissionDateTime__",
                        "PRRUIDEX__": "PRRUIDEX__",
                        "PRNumber__": "PRNumber__",
                        "PRLineNumber__": "PRLineNumber__",
                        "RequesterDN__": "RequesterDN__",
                        "BuyerDN__": "BuyerDN__",
                        "RecipientDN__": "RecipientDN__",
                        "RecipientLogin__": { "name": "RecipientLogin", "computed": true },
                        "LineNumber__": "LineItemNumber__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "RequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "RequestedDeliveryDateInPast__": "RequestedDeliveryDateInPast__",
                        "CostCenterId__": "ItemCostCenterId__",
                        "ProjectCode__": "ProjectCode__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "OrderedQuantity__": "ItemQuantity__",
                        "ReceivedQuantity__": "ItemTotalDeliveredQuantity__",
                        "DeliveryDate__": "ItemDeliveryDate__",
                        "Status__": { "name": "Status", "computed": true },
                        "CompletelyDelivered__": "ItemDeliveryComplete__",
                        "TaxCode__": "ItemTaxCode__",
                        "TaxRate__": "ItemTaxRate__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "NetAmount__": "ItemNetAmount__",
                        "ItemReceivedAmount__": "ItemReceivedAmount__",
                        "CostType__": "CostType__",
                        "GLAccount__": "ItemGLAccount__",
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeId__": "SupplyTypeId__",
                        "Group__": "ItemGroup__",
                        "BudgetID__": "BudgetID__",
                        "ExchangeRate__": "ItemExchangeRate__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "ItemType__": "ItemType__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "ItemRequestedAmount__": "ItemRequestedAmount__",
                        "Currency__": "ItemCurrency__"
                    }
                }
            };
            Items.POItemsToSES = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineServices__",
                "errorMessages": {},
                "mappings": {
                    "common": {},
                    "byLine": {
                        /*PAC PO Items (table) field name: SES items (form) field name */
                        "LineNumber__": "ItemPOLineNumber__",
                        "CatalogReference__": "ItemNumber__",
                        "Description__": "ItemDescription__",
                        "ItemType__": "ItemType__",
                        "ItemUnit__": "UnitOfMeasure__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "Currency__": "ServiceCurrency__",
                        "OrderedQuantity__": "OrderedQuantity__",
                        "RecipientDN__": "ItemPORecipientDN__"
                    }
                }
            };
            Items.POItemsToASN = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "errorMessages": {
                    "CompanyCode__": "_Only items from the same company can be selected."
                },
                "mappings": {
                    "common": {
                        "VendorName__": "VendorName__"
                    },
                    "byLine": {
                        /*PAC PO Items (table) field name: ASN items (form) field name */
                        "PONumber__": "ItemPONumber__",
                        "Description__": "ItemDescription__",
                        "RequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "OrderedQuantity__": "ItemPOLineQuantity__",
                        "ItemUnit__": "ItemUOM__",
                        "RecipientDN__": "ItemPORecipientDN__",
                        "LineNumber__": "ItemPOLineNumber__",
                        "CompanyCode__": "ItemCompanyCode__"
                    }
                }
            };
            Items.GRItemsToReturnOrder = {
                "dbInfo": Items.GRItemsCDL,
                "formTable": "LineItems__",
                "errorMessages": {
                    "CompanyCode__": "_Only items from the same company can be selected."
                },
                "mappings": {
                    "common": {},
                    "byLine": {
                        /*CDL GR (item table) field name: Return Order items (form) field name */
                        "Line_LineNumber__": "POLineNumber__",
                        "GRNumber__": "GoodsReceiptNumber__",
                        "DeliveryNote__": "DeliveryNote__",
                        // "Line_RecipientDN__": ,
                        "Line_RecipientName__": "ItemRecipient__",
                        "Line_SupplierPartID__": "ItemNumber__",
                        "Line_Description__": "Description__",
                        "Line_UnitPrice__": "UnitPrice__",
                        "Line_Currency__": "Currency__",
                        "Line_ReceivedQuantity__": "ReceivedQuantity__",
                        "Line_ItemUnit__": "UOM__",
                        "Line_ReturnedQuantity__": "AlreadyReturnedQuantity__"
                    }
                }
            };
            Items.POItemsToGR = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineNumber__",
                "errorMessages": {},
                "mappings": {
                    "common": {
                        "WarehouseID__": {
                            "name": "WarehouseID__",
                            "sectionName": "Warehouse",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "WarehouseName__": {
                            "name": "WarehouseName__",
                            "sectionName": "Warehouse",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "CompanyCode__": "CompanyCode__",
                        "PONumber__": "OrderNumber__",
                        "VendorNumber__": "VendorNumber__",
                        "VendorName__": "VendorName__"
                    },
                    "byLine": {
                        "LineNumber__": "LineNumber__",
                        "CatalogReference__": "Number__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "Description__",
                        "OrderedQuantity__": "OrderedQuantity__",
                        "UnitPrice__": "UnitPrice__",
                        "NetAmount__": "ItemOrderedAmount__",
                        "CostCenterId__": "CostCenterId__",
                        "CostCenterName__": "CostCenter__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "Group__": "Group__",
                        "RequestedDeliveryDate__": "RequestedDeliveryDate__",
                        "ExchangeRate__": "ExchangeRate__",
                        "Currency__": "Currency__",
                        "PRNumber__": "RequisitionNumber__",
                        "PONumber__": "OrderNumber__",
                        "RequesterDN__": "RequesterDN__",
                        "RecipientDN__": "RecipientDN__",
                        "BudgetID__": "BudgetID__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemType__": "ItemType__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "CostType__": "CostType__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "NotifyRequesterOnReceipt__": "NotifyRequester__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__"
                    }
                }
            };
            Items.POItemsToPickup = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineNumber__",
                "errorMessages": {},
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__",
                        "PONumber__": {
                            "name": "OrderNumber__",
                            "sectionName": "GeneralInformation",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "WarehouseID__": {
                            "name": "WarehouseID__",
                            "sectionName": "WarehouseInformation",
                            "ignoreMultipleValuesAtItemLevel": true
                        },
                        "WarehouseName__": {
                            "name": "WarehouseName__",
                            "sectionName": "WarehouseInformation",
                            "ignoreMultipleValuesAtItemLevel": true
                        }
                    },
                    "byLine": {
                        "LineNumber__": "LineNumber__",
                        "CatalogReference__": "Number__",
                        "Description__": "Description__",
                        "OrderedQuantity__": "OrderedQuantity__",
                        "UnitPrice__": "UnitPrice__",
                        "NetAmount__": "ItemOrderedAmount__",
                        "CostCenterId__": "CostCenterId__",
                        "CostCenterName__": "CostCenter__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "Group__": "Group__",
                        "RequestedDeliveryDate__": "RequestedPickupDate__",
                        "ExchangeRate__": "ExchangeRate__",
                        "Currency__": "Currency__",
                        "PRNumber__": "RequisitionNumber__",
                        "PORUIDEX__": "PORUIDEX__",
                        "PONumber__": "OrderNumber__",
                        "RequesterDN__": "RequesterDN__",
                        "RecipientDN__": "RecipientDN__",
                        "BudgetID__": "BudgetID__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemType__": "ItemType__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "CostType__": "CostType__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "NotifyRequesterOnReceipt__": "NotifyRequester__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__"
                    }
                }
            };
            Items.POItemsToPR = {
                "dbInfo": Items.POItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineNumber__",
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__"
                    },
                    "byLine": {
                        "LineNumber__": "LineNumber__",
                        "ItemType__": "ItemType__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "OrderedQuantity__": "ItemQuantity__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "NetAmount__": "ItemNetAmount__",
                        "Currency__": "ItemCurrency__",
                        "ExchangeRate__": "ItemExchangeRate__",
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeId__": "SupplyTypeID__",
                        "VendorName__": "VendorName__",
                        "VendorNumber__": "VendorNumber__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "CostCenterId__": "ItemCostCenterId__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "TaxCode__": "ItemTaxCode__",
                        "TaxRate__": "ItemTaxRate__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "CostType__": "CostType__",
                        "GLAccount__": "ItemGLAccount__",
                        "Group__": "ItemGroup__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__"
                    }
                }
            };
            Items.PRItemsToPR = {
                "dbInfo": Items.PRItemsDBInfo,
                "formTable": "LineItems__",
                "formLineNumber": "LineNumber__",
                "mappings": {
                    "common": {
                        "CompanyCode__": "CompanyCode__",
                        "Reason__": "Reason__"
                    },
                    "byLine": {
                        "LineNumber__": "LineNumber__",
                        "ItemType__": "ItemType__",
                        "CatalogReference__": "ItemNumber__",
                        "SupplierPartID__": "SupplierPartID__",
                        "Description__": "ItemDescription__",
                        "Quantity__": "ItemQuantity__",
                        "UnitPrice__": "ItemUnitPrice__",
                        "PublicPrice__": "PublicPrice__",
                        "NetAmount__": "ItemNetAmount__",
                        "Currency__": "ItemCurrency__",
                        "ExchangeRate__": "ItemExchangeRate__",
                        "SupplyTypeName__": "SupplyTypeName__",
                        "SupplyTypeId__": "SupplyTypeID__",
                        "VendorName__": "VendorName__",
                        "VendorNumber__": "VendorNumber__",
                        "CostCenterName__": "ItemCostCenterName__",
                        "CostCenterId__": "ItemCostCenterId__",
                        "ProjectCode__": "ProjectCode__",
                        "ProjectCodeDescription__": "ProjectCodeDescription__",
                        "WBSElement__": "WBSElement__",
                        "WBSElementID__": "WBSElementID__",
                        "InternalOrder__": "InternalOrder__",
                        "TaxCode__": "ItemTaxCode__",
                        "TaxRate__": "ItemTaxRate__",
                        "NonDeductibleTaxRate__": "NonDeductibleTaxRate__",
                        "CostType__": "CostType__",
                        "GLAccount__": "ItemGLAccount__",
                        "Group__": "ItemGroup__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "NoGoodsReceipt__": "NoGoodsReceipt__",
                        "NotifyRequesterOnReceipt__": "NotifyRequesterOnReceipt__",
                        "ShipToCompany__": "ItemShipToCompany__",
                        "DeliveryAddressID__": "ItemDeliveryAddressID__",
                        "ShipToAddress__": "ItemShipToAddress__",
                        "FreeDimension1__": "FreeDimension1__",
                        "FreeDimension1ID__": "FreeDimension1ID__",
                        "IsReplenishmentItem__": "IsReplenishmentItem__",
                        "WarehouseID__": "WarehouseID__",
                        "WarehouseName__": "WarehouseName__",
                        "ContractRUIDEX__": "ContractRUIDEX__",
                        "ContractNumber__": "ContractNumber__",
                        "ContractName__": "ContractName__"
                    }
                }
            };
        })(Items = Purchasing.Items || (Purchasing.Items = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
