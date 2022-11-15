/* LIB_DEFINITION{
  "name": "Lib_FormDataToTRA_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.AddLib("FormDataToTRA", function ()
{
	var EndLineSeparator = "\r\n";

	//To Generate Header Line in Tra
	var Journal =
	{
		FIXE: "***",			//[1, 3]*
		IDENTIFIANT: "JAL",		//[4, 3]*
		CODE: "",				//[7, 3]*
		LIBELLE: "",			//[10, 35]*
		NATURE: "",				//[45, 3]*
		SOUCHEN: "",			//[48, 3]
		SOUCHES: "",			//[51, 3]
		COMPTE: "",				//[54, 17]
		AXE: "",				//[71, 3]
		MODESAISIE: "",			//[74, 3]
		CPTAUTO: "",			//[77, 200]
		CPTINT: "",				//[277, 200]
		ABREGE: "",				//[477, 17]
		CODEEXPERT: ""			//[494, 1]
	};

	// To Generate Line Item Tra
	var InvoiceItem =
	{
		//Item Type
		Item_Type_Internal: "",

		//Item Obj
		Item_Obj_Internal: "",

		//Transaction Kind
		Transaction_Kind: "",

		JOURNAL: "",				//[1, 3]*
		DATECOMPTABLE: "",			//[4, 8]*
		GENERAL: "",				//[14, 17]*
		TYPEPIECE: "",				//[12, 2]*
		TYPECPTE: "",				//[31, 1]*
		AUXILIAIRE_SECTION: "",	//[32, 17]
		REFINTERNE: "",			//[49, 35]

		//GED: Docuthisnt path + filenathis
		DOCUMENT: "",				//[84, 255]

		LIBELLE: "",				//[84, 35]
		MODEPAIE: "",				//[119, 3]
		ECHEANCE: "",				//[122, 8]
		SENS: "",					//[130, 1]*
		MONTANT1: "",				//[131, 20]*
		TYPEECRITURE: "",			//[151, 1]*
		NUMEROPIECE: "",			//[152, 8]
		DEVISE: "",				//[160, 3]
		TAUXDEV: "",				//[163, 10]
		CODEMONTANT: "",			//[173, 3]*
		MONTANT2: "",				//[176, 20]
		MONTANT3: "",				//[196, 20]
		ETABLISSEMENT: "",			//[216, 3]
		AXE: "",					//[219, 2]*
		NUMECHE: "",				//[221, 2]

		//Extra infos
		REFEXTERNE: "",			//[223, 35]
		DATEREFEXTERNE: "",		//[258, 8]
		DATECREATION: "",			//[266, 8]
		SOCIETE: "",				//[274, 3]
		AFFAIRE: "",				//[277, 17]
		DATETAUXDEV: "",			//[294, 8]
		ECRANOUVEAU: "",			//[302, 3]
		QTE1: "",					//[305, 20]
		QTE2: "",					//[325, 20]
		QUALIFQTE1: "",			//[345, 3]
		QUALIFQTE2: "",			//[348, 3]
		REFLIBRE: "",				//[351, 35]

		TVAENCAISSEMENT: "",		//[386, 1]

		EXTRA_ANALYTIC_TYPEANALYTIQUE: "",//[386, 1]

		REGIMETVA: "",				//[387, 3]
		TVA: "",					//[390, 3]
		TPF: "",					//[393, 3]
		CONTREPARTIEGEN: "",		//[396, 17]
		CONTREPARTIEAUX: "",		//[413, 17]

		REFPOINTAGE: "",			//[430, 17]
		DATEPOINTAGE: "",			//[447, 8]
		DATERELANCE: "",			//[455, 8]
		DATEVALEUR: "",			//[463, 8]
		RIB: "",					//[471, 35]
		REFRELEVE: "",				//[506, 10]

		EXTRA_ANALYTIC_REFPOINTAGE: "",//[430, 1]
		EXTRA_ANALYTIC_SOUSPLAN1: "",	//[431, 17]
		EXTRA_ANALYTIC_SOUSPLAN2: "",	//[448, 17]
		EXTRA_ANALYTIC_SOUSPLAN3: "",	//[465, 17]
		EXTRA_ANALYTIC_SOUSPLAN4: "",	//[482, 17]
		EXTRA_ANALYTIC_SOUSPLAN5: "",	//[499, 17]

		NUMEROIMMO: "",			//[516, 17]
		LIBRETEXTE0: "",			//[533, 30]
		LIBRETEXTE1: "",			//[563, 30]
		LIBRETEXTE2: "",			//[593, 30]
		LIBRETEXTE3: "",			//[623, 30]
		LIBRETEXTE4: "",			//[653, 30]
		LIBRETEXTE5: "",			//[683, 30]
		LIBRETEXTE6: "",			//[713, 30]
		LIBRETEXTE7: "",			//[743, 30]
		LIBRETEXTE8: "",			//[773, 30]
		LIBRETEXTE9: "",			//[803, 30]
		NONUTILISE_TABLE0: "",		//[833, 3]
		NONUTILISE_TABLE1: "",		//[836, 3]
		NONUTILISE_TABLE2: "",		//[839, 3]
		NONUTILISE_TABLE3: "",		//[842, 3]
		LIBREMONTANT0: "",			//[845, 20]
		LIBREMONTANT1: "",			//[865, 20]
		LIBREMONTANT2: "",			//[885, 20]
		LIBREMONTANT3: "",			//[905, 20]
		LIBREDATE: "",				//[925, 8]
		LIBREBOOL0: "",			//[933, 1]
		LIBREBOOL1: "",			//[934, 1]
		CONSO: "",					//[935, 3]

		COUVERTURE: "",			//[938, 20]
		COUVERTUREDEV: "",			//[958, 20]
		COUVERTUREEURO: "",		//[978, 20]

		EXTRA_ANALYTIC_POURCENTAGE: "",//[938, 20]
		EXTRA_ANALYTIC_POURCENTQTE1: "",//[958, 20]
		EXTRA_ANALYTIC_POURCENTQTE2: "",//[978, 20]

		DATEPAQUETMAX: "",			//[998, 8]
		DATEPAQUETMIN: "",			//[1006, 8]

		LETTRAGE: "",				//[1014, 5]

		EXTRA_ANALYTIC_NUMVENTIL: "",	//[1014, 5]

		LETTRAGEDEV: "",	//[1019, 1]
		LETTRAGEURO: "",	//[1020, 1]
		ETATLETTRAGE: "",	//[1021, 3]
		TABLE0: "",		//[1024, 17]
		TABLE1: "",		//[1041, 17]
		TABLE2: "",		//[1058, 17]
		TABLE3: "",		//[1075, 17]
		REFGESCOM: "",		//[1092, 35]
		TYPEMVT: "",		//[1127, 3]
		DOCID_GED65: "",	//[1130, 10]
		TRESOSYNCHRO: "",	//[1140, 3]
		NUMTRAITECHQ: "",	//[1143, 17]
		NUMENCADECA: "",	//[1160, 17]
		VALIDE: "",		//[1177, 1]

		CUTOFFDEB: "",		//[1178, 8]
		CUTOFFFIN: "",		//[1186, 8]
		CUTOFFDATECALC: "",//[1194, 8]
		CLEECR: "",		//[1202, 35]
		CONFIDENTIEL: "",	//[1237, 1]
		CFONBOK: "",		//[1238, 1]
		CODEACCEPT: "",	//[1239, 3]
		DOCID: "",			//[1242, 8]
		ECHCOMPTE: "",		//[1250, 17]
		ECHJOURNAL: "",	//[1267, 3]
		DATETRI: "",		//[1270, 8]
		QUALIFORIGINE: "",	//[1278, 3]

		EXTRA_ANALYTIC_CONFIDENTIEL: "" //[1178, 1]
	};

	var formDataToTRA = {
		// The cumulative amount for each tax code in the invoice
		g_taxAmountsArray: {},

		Number_DW2CEGID: function (inputNumber, nDecimals, abs)
		{
			var n = parseFloat(inputNumber);
			if (abs)
			{
				n = Math.abs(n);
			}

			if (nDecimals !== undefined)
			{
				n = n.toFixed(nDecimals);
			}
			return n.toString().replace(".", ",");
		},

		GetFirstValue: function (values)
		{
			if (values && typeof values === "string")
			{
				return values.split(",")[0];
			}
			return values;
		},

		Date_DW2CEGID: function (date)
		{
			// Assuming input format is yyyy-mm-dd
			var result = "";
			if (date && typeof date === "string" && date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/))
			{
				result = date.substr(8, 2) + date.substr(5, 2) + date.substr(0, 4);
			}
			return result;
		},

		FormatField: function (id, Length, alignRight)
		{
			if (!id)
			{
				return Array(Length + 1).join(" ");
			}

			if (Length > id.length)
			{
				var temp_length = Length - id.length;
				var spaces = Array(temp_length + 1).join(" ");

				if (alignRight)
				{
					return spaces + id;
				}
				else
				{
					return id + spaces;
				}
			}
			return id.substring(0, Length);
		},

		BuildSectionFilter: function (possibleAxes, section, companyCode)
		{
			if (possibleAxes.length === 0)
			{
				throw "No possible axes";
			}

			var filter = "&(Section__=" + section + ")";
			var axeFilter = "(Axe__=" + possibleAxes[0] + ")";

			for (var i = 1; i < possibleAxes.length; i++)
			{
				axeFilter += "(Axe__=" + possibleAxes[i] + ")";
			}
			if (possibleAxes.length > 1)
			{
				filter = filter + "(|" + axeFilter + ")";
			}
			else
			{
				filter += axeFilter;
			}
			filter = filter.AddCompanyCodeFilter(companyCode);
			return filter;
		},

		GetAnalyticAxe: function (glAccount, section, companyCode)
		{
			var axe = "";
			var possibleAxes = [];
			var record, vars;

			var query = Process.CreateQuery();
			query.SetSpecificTable("AP - G/L accounts__");
			query.SetAttributesList("Allocable1__,Allocable2__,Allocable3__,Allocable4__,Allocable5__");
			var filter = "Account__=" + glAccount;
			filter = filter.AddCompanyCodeFilter(companyCode);
			query.SetFilter(filter);

			if (query.MoveFirst())
			{
				record = query.MoveNextRecord();
				if (record)
				{
					vars = record.GetVars();

					for (var i = 1; i <= 5; i++)
					{
						if (vars.GetValue_Long("Allocable" + i + "__", 0))
						{
							possibleAxes.push("A" + i);
						}
					}
				}
			}

			if (possibleAxes.length > 0)
			{
				query = Process.CreateQuery();
				query.SetSpecificTable("AP - Sections__");
				query.SetAttributesList("Axe__");
				query.SetFilter(this.BuildSectionFilter(possibleAxes, section, companyCode));

				if (query.MoveFirst())
				{
					record = query.MoveNextRecord();
					if (record)
					{
						vars = record.GetVars();
						axe = vars.GetValue_String("Axe__", 0);
					}
				}
			}

			return axe;
		},

		ResetJournal: function ()
		{
			Journal.FIXE = "***";
			Journal.IDENTIFIANT = "JAL";
			Journal.CODE = "ACH";
			Journal.LIBELLE = "";
			Journal.NATURE = "";
			Journal.SOUCHEN = "";
			Journal.SOUCHES = "";
			Journal.COMPTE = "";
			Journal.AXE = "";
			Journal.MODESAISIE = "";
			Journal.CPTAUTO = "";
			Journal.CPTINT = "";
			Journal.ABREGE = "";
			Journal.CODEEXPERT = "";
		},

		JournalToString: function ()
		{
			return this.FormatField(Journal.FIXE, 3, false) +
				this.FormatField(Journal.IDENTIFIANT, 3, false) +
				this.FormatField(Journal.CODE, 3, false) +
				this.FormatField(Journal.LIBELLE, 3, false) +
				this.FormatField(Journal.NATURE, 3, false) +
				this.FormatField(Journal.SOUCHEN, 3, false) +
				this.FormatField(Journal.SOUCHES, 3, false) +
				this.FormatField(Journal.COMPTE, 3, false) +
				this.FormatField(Journal.AXE, 3, false) +
				this.FormatField(Journal.MODESAISIE, 3, false) +
				this.FormatField(Journal.CPTAUTO, 3, false) +
				this.FormatField(Journal.CPTINT, 3, false) +
				this.FormatField(Journal.ABREGE, 3, false) +
				this.FormatField(Journal.CODEEXPERT, 3, false);
		},

		ResetInvoiceItem: function ()
		{
			//Item Type
			InvoiceItem.Item_Type_Internal = "";

			//Item Obj
			InvoiceItem.Item_Obj_Internal = "";

			//Transaction Kind
			InvoiceItem.Transaction_Kind = "";

			InvoiceItem.JOURNAL = "";				//[1, 3]*
			InvoiceItem.DATECOMPTABLE = "";		//[4, 8]*
			InvoiceItem.GENERAL = "";				//[14, 17]*
			InvoiceItem.TYPEPIECE = "";			//[12, 2]*
			InvoiceItem.TYPECPTE = "";				//[31, 1]*
			InvoiceItem.AUXILIAIRE_SECTION = "";	//[32, 17]
			InvoiceItem.REFINTERNE = "";			//[49, 35]

			//GED: Docuthisnt path + filenathis
			InvoiceItem.DOCUMENT = "";				//[84, 255]

			InvoiceItem.LIBELLE = "";				//[84, 35]
			InvoiceItem.MODEPAIE = "";				//[119, 3]
			InvoiceItem.ECHEANCE = "";				//[122, 8]
			InvoiceItem.SENS = "";					//[130, 1]*
			InvoiceItem.MONTANT1 = "";				//[131, 20]*
			InvoiceItem.TYPEECRITURE = "";			//[151, 1]*
			InvoiceItem.NUMEROPIECE = "";			//[152, 8]
			InvoiceItem.DEVISE = "";				//[160, 3]
			InvoiceItem.TAUXDEV = "";				//[163, 10]
			InvoiceItem.CODEMONTANT = "";			//[173, 3]*
			InvoiceItem.MONTANT2 = "";				//[176, 20]
			InvoiceItem.MONTANT3 = "";				//[196, 20]
			InvoiceItem.ETABLISSEMENT = "";		//[216, 3]
			InvoiceItem.AXE = "";					//[219, 2]*
			InvoiceItem.NUMECHE = "";				//[221, 2]

			//Extra infos
			InvoiceItem.REFEXTERNE = "";		//[223, 35]
			InvoiceItem.DATEREFEXTERNE = "";	//[258, 8]
			InvoiceItem.DATECREATION = "";		//[266, 8]
			InvoiceItem.SOCIETE = "";			//[274, 3]
			InvoiceItem.AFFAIRE = "";			//[277, 17]
			InvoiceItem.DATETAUXDEV = "";		//[294, 8]
			InvoiceItem.ECRANOUVEAU = "";		//[302, 3]
			InvoiceItem.QTE1 = "";				//[305, 20]
			InvoiceItem.QTE2 = "";				//[325, 20]
			InvoiceItem.QUALIFQTE1 = "";		//[345, 3]
			InvoiceItem.QUALIFQTE2 = "";		//[348, 3]
			InvoiceItem.REFLIBRE = "";			//[351, 35]

			InvoiceItem.TVAENCAISSEMENT = ""; //[386, 1]

			InvoiceItem.EXTRA_ANALYTIC_TYPEANALYTIQUE = ""; //[386, 1]

			InvoiceItem.REGIMETVA = "";	//[387, 3]
			InvoiceItem.TVA = "";			//[390, 3]
			InvoiceItem.TPF = "";			//[393, 3]
			InvoiceItem.CONTREPARTIEGEN = ""; //[396, 17]
			InvoiceItem.CONTREPARTIEAUX = ""; //[413, 17]

			InvoiceItem.REFPOINTAGE = "";	//[430, 17]
			InvoiceItem.DATEPOINTAGE = "";	//[447, 8]
			InvoiceItem.DATERELANCE = "";	//[455, 8]
			InvoiceItem.DATEVALEUR = "";	//[463, 8]
			InvoiceItem.RIB = "";			//[471, 35]
			InvoiceItem.REFRELEVE = "";	//[506, 10]

			InvoiceItem.EXTRA_ANALYTIC_REFPOINTAGE = ""; //[430, 1]
			InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN1 = "";	//[431, 17]
			InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN2 = "";	//[448, 17]
			InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN3 = "";	//[465, 17]
			InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN4 = "";	//[482, 17]
			InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN5 = "";	//[499, 17]

			InvoiceItem.NUMEROIMMO = "";			//[516, 17]
			InvoiceItem.LIBRETEXTE0 = "";			//[533, 30]
			InvoiceItem.LIBRETEXTE1 = "";			//[563, 30]
			InvoiceItem.LIBRETEXTE2 = "";			//[593, 30]
			InvoiceItem.LIBRETEXTE3 = "";			//[623, 30]
			InvoiceItem.LIBRETEXTE4 = "";			//[653, 30]
			InvoiceItem.LIBRETEXTE5 = "";			//[683, 30]
			InvoiceItem.LIBRETEXTE6 = "";			//[713, 30]
			InvoiceItem.LIBRETEXTE7 = "";			//[743, 30]
			InvoiceItem.LIBRETEXTE8 = "";			//[773, 30]
			InvoiceItem.LIBRETEXTE9 = "";			//[803, 30]
			InvoiceItem.NONUTILISE_TABLE0 = "";	//[833, 3]
			InvoiceItem.NONUTILISE_TABLE1 = "";	//[836, 3]
			InvoiceItem.NONUTILISE_TABLE2 = "";	//[839, 3]
			InvoiceItem.NONUTILISE_TABLE3 = "";	//[842, 3]
			InvoiceItem.LIBREMONTANT0 = "";		//[845, 20]
			InvoiceItem.LIBREMONTANT1 = "";		//[865, 20]
			InvoiceItem.LIBREMONTANT2 = "";		//[885, 20]
			InvoiceItem.LIBREMONTANT3 = "";		//[905, 20]
			InvoiceItem.LIBREDATE = "";			//[925, 8]
			InvoiceItem.LIBREBOOL0 = "";			//[933, 1]
			InvoiceItem.LIBREBOOL1 = "";			//[934, 1]
			InvoiceItem.CONSO = "";				//[935, 3]

			InvoiceItem.COUVERTURE = "";			//[938, 20]
			InvoiceItem.COUVERTUREDEV = "";		//[958, 20]
			InvoiceItem.COUVERTUREEURO = "";		//[978, 20]

			InvoiceItem.EXTRA_ANALYTIC_POURCENTAGE = "";	//[938, 20]
			InvoiceItem.EXTRA_ANALYTIC_POURCENTQTE1 = "";	//[958, 20]
			InvoiceItem.EXTRA_ANALYTIC_POURCENTQTE2 = "";	//978, 20]

			InvoiceItem.DATEPAQUETMAX = "";			//[998, 8]
			InvoiceItem.DATEPAQUETMIN = "";			//[1006, 8]

			InvoiceItem.LETTRAGE = "";					//[1014, 5]

			InvoiceItem.EXTRA_ANALYTIC_NUMVENTIL = "";	//[1014, 5]

			InvoiceItem.LETTRAGEDEV = "";				//[1019, 1]
			InvoiceItem.LETTRAGEURO = "";				//[1020, 1]
			InvoiceItem.ETATLETTRAGE = "";				//[1021, 3]
			InvoiceItem.TABLE0 = "";					//[1024, 17]
			InvoiceItem.TABLE1 = "";					//[1041, 17]
			InvoiceItem.TABLE2 = "";					//[1058, 17]
			InvoiceItem.TABLE3 = "";					//[1075, 17]
			InvoiceItem.REFGESCOM = "";				//[1092, 35]
			InvoiceItem.TYPEMVT = "";					//[1127, 3]
			InvoiceItem.DOCID_GED65 = "";				//[1130, 10]
			InvoiceItem.TRESOSYNCHRO = "";				//[1140, 3]
			InvoiceItem.NUMTRAITECHQ = "";				//[1143, 17]
			InvoiceItem.NUMENCADECA = "";				//[1160, 17]
			InvoiceItem.VALIDE = "";					//[1177, 1]

			InvoiceItem.CUTOFFDEB = "";				//[1178, 8]
			InvoiceItem.CUTOFFFIN = "";				//[1186, 8]
			InvoiceItem.CUTOFFDATECALC = "";			//[1194, 8]
			InvoiceItem.CLEECR = "";					//[1202, 35]
			InvoiceItem.CONFIDENTIEL = "";				//[1237, 1]
			InvoiceItem.CFONBOK = "";					//[1238, 1]
			InvoiceItem.CODEACCEPT = "";				//[1239, 3]
			InvoiceItem.DOCID = "";					//[1242, 8]
			InvoiceItem.ECHCOMPTE = "";				//[1250, 17]
			InvoiceItem.ECHJOURNAL = "";				//[1267, 3]
			InvoiceItem.DATETRI = "";					//[1270, 8]
			InvoiceItem.QUALIFORIGINE = "";			//[1278, 3]

			InvoiceItem.EXTRA_ANALYTIC_CONFIDENTIEL = "";	//[1178, 1]
		},

		ClearTaxAmounts: function ()
		{
			this.g_taxAmountsArray = {};
		},

		AddTaxAmount: function (taxCode, taxAmount)
		{
			taxAmount = parseFloat(taxAmount);
			if (!taxAmount)
			{
				taxAmount = 0;
			}
			// Check if current tax code already exists
			if (taxCode)
			{
				if (this.g_taxAmountsArray[taxCode])
				{
					this.g_taxAmountsArray[taxCode].taxAmount += taxAmount;
				}
				else
				{
					this.g_taxAmountsArray[taxCode] = { "taxAmount": taxAmount };
				}
			}
		},

		InitCommonParts: function (dataSrc, itemLine, vendorHelperObj)
		{
			InvoiceItem.Item_Obj_Internal = itemLine;

			//JOURNAL
			InvoiceItem.JOURNAL = "ACH";

			//DATECOMPTABLE
			InvoiceItem.DATECOMPTABLE = this.Date_DW2CEGID(dataSrc.GetValue("InvoiceDate__"));

			//TRANSACTION_KIND
			if (dataSrc.GetValue("NetAmount__") < 0)
			{
				InvoiceItem.Transaction_Kind = "CREDITMEMO";
				//Avoir Fournisseur
				InvoiceItem.TYPEPIECE = "AF";
			}
			else
			{
				InvoiceItem.Transaction_Kind = "DEBITMEMO";
				//Facture Fournisseur
				InvoiceItem.TYPEPIECE = "FF";
			}

			//TYPEECRITURE
			//Normal
			InvoiceItem.TYPEECRITURE = "N";

			//NUMEROPIECE
			//CEGID auto-determination
			InvoiceItem.NUMEROPIECE = "";

			//DEVISE
			InvoiceItem.DEVISE = dataSrc.GetValue("InvoiceCurrency__");

			//TAUXDEV
			if (InvoiceItem.DEVISE === "EUR")
			{
				InvoiceItem.TAUXDEV = "1,00000000";
				//Euro, '-' for MONTANT2, '-' for MONTANT3
				InvoiceItem.CODEMONTANT = "E--";
			}
			else
			{
				//Let CEGID handle rate conversion
				InvoiceItem.TAUXDEV = "";
				//Devise, '-' for MONTANT2, '-' for MONTANT3
				InvoiceItem.CODEMONTANT = "D--";
			}

			//MONTANT2
			InvoiceItem.MONTANT2 = "";

			//MONTANT3
			InvoiceItem.MONTANT3 = "";

			//ETABLISSEMENT
			InvoiceItem.ETABLISSEMENT = dataSrc.GetValue("CompanyCode__");

			//ECRANOUVEAU
			InvoiceItem.ECRANOUVEAU = "N";	//Normal

			if (vendorHelperObj)
			{
				if (!(InvoiceItem.Item_Type_Internal.toLowerCase() === "a" || InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H"))
				{
					//TVAENCAISSEMENT
					//CEGID INFORMATION
					if (vendorHelperObj.TVAENCAISSEMENT === "TE" || vendorHelperObj.TVAENCAISSEMENT === "TM")
					{
						InvoiceItem.TVAENCAISSEMENT = "X";
					}
					else
					{
						InvoiceItem.TVAENCAISSEMENT = "-";
					}

					//REGIMETVA
					InvoiceItem.REGIMETVA = vendorHelperObj.REGIMETVA;

					if (InvoiceItem.Item_Type_Internal.toLowerCase() === "g" && InvoiceItem.Item_Obj_Internal)
					{
						if (vendorHelperObj.SOUMISTPF)
						{
							//TPF
							InvoiceItem.TPF = InvoiceItem.Item_Obj_Internal.GetValue("TaxCode__");
						}
						else
						{
							//TVA
							InvoiceItem.TVA = InvoiceItem.Item_Obj_Internal.GetValue("TaxCode__");
						}
					}
				}
			}

			//ETATLETTRAGE
			InvoiceItem.ETATLETTRAGE = "AL";
		},

		/**
		* Get the informations about the vendor
		* @param {object} : the data of the invoice currently exported
		* @return {object} : An object with the informations about the vendor
		**/
		GetVendorHelper: function (dataSrc)
		{
			var vendorInfo =
			{
				SOCIETE: dataSrc.GetValue("CompanyCode__"),
				GENERAL: "",
				AUXILIAIRE: dataSrc.GetValue("VendorNumber__"),
				REGIMETVA: "",
				SOUMISTPF: false,
				TVAENCAISSEMENT: "",
				DEVISE: ""
			};

			var query = Process.CreateQuery();
			query.SetSpecificTable("AP - Vendors__");
			query.SetAttributesList("GeneralAccount__, TaxSystem__, Currency__, ParafiscalTax__, SupplierDue__");
			query.SetFilter("(&(Number__=" + dataSrc.GetValue("VendorNumber__") + ")(CompanyCode__=" + dataSrc.GetValue("CompanyCode__") + "))");

			if (query.MoveFirst())
			{
				var vendorRec = query.MoveNextRecord();
				if (vendorRec)
				{
					var vendorInfoVars = vendorRec.GetVars();
					vendorInfo.GENERAL = vendorInfoVars.GetValue_String("GeneralAccount__", 0);
					vendorInfo.REGIMETVA = vendorInfoVars.GetValue_String("TaxSystem__", 0);
					vendorInfo.DEVISE = vendorInfoVars.GetValue_String("Currency__", 0);
					vendorInfo.SOUMISTPF = vendorInfoVars.GetValue_Long("ParafiscalTax__", 0) === 1;
					vendorInfo.TVAENCAISSEMENT = vendorInfoVars.GetValue_String("SupplierDue__", 0);
				}
				else
				{
					Log.Error("Unable to retrieve vendor informations : " + Query.GetLastErrorMessage());
				}
			}

			return vendorInfo;
		},

		/**
		* Get the associated tax account from a specific tax code for a vendor
		* @param {string} taxCode
		* @param {object} vendorInfo - The VendorInfo object containing the informations about the vendor
		* @return {string} A string with the account associated with the tax code for this vendor
		**/
		GetTaxAccountFromTaxCode: function (taxCode, vendorInfo)
		{
			if (!vendorInfo)
			{
				return "";
			}

			var taxAccount = "";
			var query = Process.CreateQuery();
			query.SetSpecificTable("AP - Tax codes__");

			var queryFilter = "(&(|(CompanyCode__=" + vendorInfo.SOCIETE + ")(CompanyCode__=)(CompanyCode__!=*))(TaxCode__=" + taxCode + ")";
			if (vendorInfo.SOUMISTPF)
			{
				queryFilter += "(TaxType__=TX2))";
			}
			else
			{
				queryFilter += "(TaxType__=TX1))";
			}

			query.SetFilter(queryFilter);

			var attributeName;
			if (vendorInfo.TVAENCAISSEMENT === "TE")
			{
				attributeName = "TaxAccountForCollection__";
			}
			else
			{
				attributeName = "TaxAccount__";
			}
			query.SetAttributesList(attributeName);

			if (query.MoveFirst())
			{
				var taxCodeRec = query.MoveNextRecord();
				if (taxCodeRec)
				{
					var taxCodeVars = taxCodeRec.GetVars();
					taxAccount = taxCodeVars.GetValue_String(attributeName, 0);
				}
			}

			return taxAccount;
		},

		//dataSrc = forms
		//itemLine : line to process
		//doReset : reset context
		InitGLItem: function (dataSrc, itemLine, doReset, vendorHelperObj)
		{
			if (doReset)
			{
				this.ResetInvoiceItem();
			}

			InvoiceItem.Item_Type_Internal = "G";
			this.InitCommonParts(dataSrc, itemLine, vendorHelperObj);

			if (itemLine)
			{
				InvoiceItem.GENERAL = itemLine.GetValue("GLAccount__");
				InvoiceItem.LIBELLE = itemLine.GetValue("Description__");
			}

			InvoiceItem.TYPECPTE = "";

			var amount = itemLine.GetValue("Amount__");
			if (amount < 0)
			{
				InvoiceItem.SENS = "C";
			}
			else
			{
				InvoiceItem.SENS = "D";
			}

			if (InvoiceItem.MONTANT1 === "")
			{
				InvoiceItem.MONTANT1 = this.Number_DW2CEGID(itemLine.GetValue("Amount__"), 2, true);
			}

			InvoiceItem.NUMECHE = "0";

			return true;
		},

		//dataSrc = forms
		//itemLine : line to process
		//doReset : reset context
		InitAnalyticItem: function (dataSrc, itemLine, doReset, vendorHelperObj)
		{
			if (doReset)
			{
				this.ResetInvoiceItem();
			}

			InvoiceItem.Item_Type_Internal = "A";
			this.InitCommonParts(dataSrc, itemLine, vendorHelperObj);

			//TYPECPTE
			//Analytique
			InvoiceItem.TYPECPTE = "A";

			//AUXILIAIRE_SECTION
			if (itemLine)
			{
				InvoiceItem.GENERAL = itemLine.GetValue("GLAccount__");
				InvoiceItem.AUXILIAIRE_SECTION = itemLine.GetValue("CostCenter__");
				InvoiceItem.LIBELLE = itemLine.GetValue("Description__");
			}

			//SENS/MONTANT1
			var amount = itemLine.GetValue("Amount__");
			if (amount < 0)
			{
				InvoiceItem.SENS = "C";
			}
			else
			{
				InvoiceItem.SENS = "D";
			}
			InvoiceItem.MONTANT1 = this.Number_DW2CEGID(itemLine.GetValue("Amount__"), 2, true);

			//AXE
			InvoiceItem.AXE = this.GetAnalyticAxe(itemLine.GetValue("GLAccount__"), InvoiceItem.AUXILIAIRE_SECTION, dataSrc.GetValue("CompanyCode__"));

			return true;
		},

		InitTaxItem: function (dataSrc, itemLine, doReset, vendorHelperObj, taxCode, taxAmount)
		{
			if (doReset)
			{
				this.ResetInvoiceItem();
			}

			if (!taxCode || taxCode === "EXO")
			{
				return false;
			}

			if (taxAmount < 0)
			{
				InvoiceItem.SENS = "C";
			}
			else
			{
				InvoiceItem.SENS = "D";
			}

			InvoiceItem.MONTANT1 = this.Number_DW2CEGID(Math.abs(taxAmount), 2, true);

			InvoiceItem.Item_Type_Internal = "T";
			this.InitCommonParts(dataSrc, itemLine, vendorHelperObj);

			InvoiceItem.TYPECPTE = "";

			InvoiceItem.GENERAL = this.GetTaxAccountFromTaxCode(taxCode, vendorHelperObj);
			if (!InvoiceItem.GENERAL)
			{
				return false;
			}

			InvoiceItem.REFINTERNE = dataSrc.GetValue("InvoiceNumber__");
			InvoiceItem.REFEXTERNE = this.GetFirstValue(dataSrc.GetValue("OrderNumber__"));

			return true;
		},

		//dataSrc = forms
		//itemLine : line to process
		InitVendorItem: function (dataSrc, vendorHelperObj)
		{
			this.ResetInvoiceItem();

			InvoiceItem.Item_Type_Internal = "V";
			this.InitCommonParts(dataSrc, null, vendorHelperObj);

			//GENERAL
			//CEGID INFORMATION
			InvoiceItem.GENERAL = vendorHelperObj.GENERAL;

			//TYPECPTE
			//Auxiliaire
			InvoiceItem.TYPECPTE = "X";

			//AUXILIAIRE_SECTION
			InvoiceItem.AUXILIAIRE_SECTION = vendorHelperObj.AUXILIAIRE;

			//REFs
			InvoiceItem.REFINTERNE = dataSrc.GetValue("InvoiceNumber__");
			InvoiceItem.REFEXTERNE = this.GetFirstValue(dataSrc.GetValue("OrderNumber__"));

			// Not supported in Flexible Forms: InvoiceDescription__ and InvoicePaymentMethod__
			var vendorName = dataSrc.GetValue("VendorName__");
			if (!vendorName)
			{
				vendorName = "";
			}
			InvoiceItem.LIBELLE = vendorName.substr(0, 20);
			InvoiceItem.MODEPAIE = "";

			//ECHEANCE
			InvoiceItem.ECHEANCE = this.Date_DW2CEGID(dataSrc.GetValue("DueDate__"));

			//SENS/MONTANT1
			if (InvoiceItem.SENS === "")
			{
				if (dataSrc.GetValue("InvoiceAmount__") < 0)
				{
					InvoiceItem.SENS = "D";
				}
				else
				{
					InvoiceItem.SENS = "C";
				}
			}

			if (InvoiceItem.MONTANT1 === "")
			{
				InvoiceItem.MONTANT1 = this.Number_DW2CEGID(dataSrc.GetValue("InvoiceAmount__"), 2, true).toString();
			}

			//NUMECHE
			InvoiceItem.NUMECHE = "1";

			InvoiceItem.DATECREATION = this.Date_DW2CEGID(dataSrc.GetValue("ERPPostingDate__"));

			return true;
		},

		InvoiceItemToString: function ()
		{
			var ReturnString = this.FormatField(InvoiceItem.JOURNAL, 3, false) +
				this.FormatField(InvoiceItem.DATECOMPTABLE, 8, false) +
				this.FormatField(InvoiceItem.TYPEPIECE, 2, false) +
				this.FormatField(InvoiceItem.GENERAL, 17, false) +
				this.FormatField(InvoiceItem.TYPECPTE, 1, false) +
				this.FormatField(InvoiceItem.AUXILIAIRE_SECTION, 17, false) +
				this.FormatField(InvoiceItem.REFINTERNE, 35, false);

			//GED Item
			if (InvoiceItem.Item_Type_Internal === "D" || InvoiceItem.TYPECPTE === "G")
			{
				ReturnString += this.FormatField(InvoiceItem.DOCUMENT, 255, false);
				return ReturnString;
			}

			ReturnString += this.FormatField(InvoiceItem.LIBELLE, 35, false) +
				this.FormatField(InvoiceItem.MODEPAIE, 3, false) +
				this.FormatField(InvoiceItem.ECHEANCE, 8, false) +
				this.FormatField(InvoiceItem.SENS, 1, false) +
				this.FormatField(InvoiceItem.MONTANT1, 20, true) +
				this.FormatField(InvoiceItem.TYPEECRITURE, 1, false) +
				this.FormatField(InvoiceItem.NUMEROPIECE, 8, true) +
				this.FormatField(InvoiceItem.DEVISE, 3, false) +
				this.FormatField(InvoiceItem.TAUXDEV, 10, true) +
				this.FormatField(InvoiceItem.CODEMONTANT, 3, false) +
				this.FormatField(InvoiceItem.MONTANT2, 20, true) +
				this.FormatField(InvoiceItem.MONTANT3, 20, true) +
				this.FormatField(InvoiceItem.ETABLISSEMENT, 3, false) +
				this.FormatField(InvoiceItem.AXE, 2, false) +
				this.FormatField(InvoiceItem.NUMECHE, 2, true);

			//ExtraInfo
			ReturnString += this.FormatField(InvoiceItem.REFEXTERNE, 35, false) +
				this.FormatField(InvoiceItem.DATEREFEXTERNE, 8, false) +
				this.FormatField(InvoiceItem.DATECREATION, 8, false) +
				this.FormatField(InvoiceItem.SOCIETE, 3, false) +
				this.FormatField(InvoiceItem.AFFAIRE, 17, false) +
				this.FormatField(InvoiceItem.DATETAUXDEV, 8, false) +
				this.FormatField(InvoiceItem.ECRANOUVEAU, 3, false) +
				this.FormatField(InvoiceItem.QTE1, 20, true) +
				this.FormatField(InvoiceItem.QTE2, 20, true) +
				this.FormatField(InvoiceItem.QUALIFQTE1, 3, false) +
				this.FormatField(InvoiceItem.QUALIFQTE2, 3, false) +
				this.FormatField(InvoiceItem.REFLIBRE, 35, false);

			if (InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H")
			{
				ReturnString += this.FormatField(InvoiceItem.EXTRA_ANALYTIC_TYPEANALYTIQUE, 1, false);
			}
			else
			{
				ReturnString += this.FormatField(InvoiceItem.TVAENCAISSEMENT, 1, false);
			}

			ReturnString += this.FormatField(InvoiceItem.REGIMETVA, 3, false) +
				this.FormatField(InvoiceItem.TVA, 3, false) +
				this.FormatField(InvoiceItem.TPF, 3, false) +
				this.FormatField(InvoiceItem.CONTREPARTIEGEN, 17, false) +
				this.FormatField(InvoiceItem.CONTREPARTIEAUX, 17, false);

			if (InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H")
			{
				ReturnString += this.FormatField(InvoiceItem.EXTRA_ANALYTIC_REFPOINTAGE, 1, false) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN1, 17, false) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN2, 17, false) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN3, 17, false) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN4, 17, false) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_SOUSPLAN5, 17, false);
			}
			else
			{
				ReturnString += this.FormatField(InvoiceItem.REFPOINTAGE, 17, false) +
					this.FormatField(InvoiceItem.DATEPOINTAGE, 8, false) +
					this.FormatField(InvoiceItem.DATERELANCE, 8, false) +
					this.FormatField(InvoiceItem.DATEVALEUR, 8, false) +
					this.FormatField(InvoiceItem.RIB, 35, false) +
					this.FormatField(InvoiceItem.REFRELEVE, 10, false);
			}

			ReturnString += this.FormatField(InvoiceItem.NUMEROIMMO, 17, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE0, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE1, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE2, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE3, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE4, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE5, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE6, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE7, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE8, 30, false) +
				this.FormatField(InvoiceItem.LIBRETEXTE9, 30, false) +
				this.FormatField(InvoiceItem.NONUTILISE_TABLE0, 3, false) +
				this.FormatField(InvoiceItem.NONUTILISE_TABLE1, 3, false) +
				this.FormatField(InvoiceItem.NONUTILISE_TABLE2, 3, false) +
				this.FormatField(InvoiceItem.NONUTILISE_TABLE3, 3, false) +
				this.FormatField(InvoiceItem.LIBREMONTANT0, 20, true) +
				this.FormatField(InvoiceItem.LIBREMONTANT1, 20, true) +
				this.FormatField(InvoiceItem.LIBREMONTANT2, 20, true) +
				this.FormatField(InvoiceItem.LIBREMONTANT3, 20, true) +
				this.FormatField(InvoiceItem.LIBREDATE, 8, false) +
				this.FormatField(InvoiceItem.LIBREBOOL0, 1, false) +
				this.FormatField(InvoiceItem.LIBREBOOL1, 1, false) +
				this.FormatField(InvoiceItem.CONSO, 3, false);

			if (InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H")
			{
				ReturnString += this.FormatField(InvoiceItem.EXTRA_ANALYTIC_POURCENTAGE, 20, true) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_POURCENTQTE1, 20, true) +
					this.FormatField(InvoiceItem.EXTRA_ANALYTIC_POURCENTQTE2, 20, true);
			}
			else
			{
				ReturnString += this.FormatField(InvoiceItem.COUVERTURE, 20, true) +
					this.FormatField(InvoiceItem.COUVERTUREDEV, 20, true) +
					this.FormatField(InvoiceItem.COUVERTUREEURO, 20, true);
			}

			ReturnString += this.FormatField(InvoiceItem.DATEPAQUETMAX, 8, false) +
				this.FormatField(InvoiceItem.DATEPAQUETMIN, 8, false);

			if (InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H")
			{
				ReturnString += this.FormatField(InvoiceItem.EXTRA_ANALYTIC_NUMVENTIL, 5, false);
			}
			else
			{
				ReturnString += this.FormatField(InvoiceItem.LETTRAGE, 5, false);
			}

			ReturnString += this.FormatField(InvoiceItem.LETTRAGEDEV, 1, false) +
				this.FormatField(InvoiceItem.LETTRAGEURO, 1, false) +
				this.FormatField(InvoiceItem.ETATLETTRAGE, 3, false) +
				this.FormatField(InvoiceItem.TABLE0, 17, false) +
				this.FormatField(InvoiceItem.TABLE1, 17, false) +
				this.FormatField(InvoiceItem.TABLE2, 17, false) +
				this.FormatField(InvoiceItem.TABLE3, 17, false) +
				this.FormatField(InvoiceItem.REFGESCOM, 35, false) +
				this.FormatField(InvoiceItem.TYPEMVT, 3, false) +
				this.FormatField(InvoiceItem.DOCID_GED65, 10, true) +
				this.FormatField(InvoiceItem.TRESOSYNCHRO, 3, false) +
				this.FormatField(InvoiceItem.NUMTRAITECHQ, 17, false) +
				this.FormatField(InvoiceItem.NUMENCADECA, 17, false) +
				this.FormatField(InvoiceItem.VALIDE, 1, false);

			if (InvoiceItem.TYPECPTE === "A" || InvoiceItem.TYPECPTE === "H")
			{
				ReturnString += this.FormatField(InvoiceItem.EXTRA_ANALYTIC_CONFIDENTIEL, 1, false);
			}
			else
			{
				ReturnString += this.FormatField(InvoiceItem.CUTOFFDEB, 8, false) +
					this.FormatField(InvoiceItem.CUTOFFFIN, 8, false) +
					this.FormatField(InvoiceItem.CUTOFFDATECALC, 8, false) +
					this.FormatField(InvoiceItem.CLEECR, 35, false) +
					this.FormatField(InvoiceItem.CONFIDENTIEL, 1, false) +
					this.FormatField(InvoiceItem.CFONBOK, 1, false) +
					this.FormatField(InvoiceItem.CODEACCEPT, 3, false) +
					this.FormatField(InvoiceItem.DOCID, 8, true) +
					this.FormatField(InvoiceItem.ECHCOMPTE, 17, false) +
					this.FormatField(InvoiceItem.ECHJOURNAL, 3, false) +
					this.FormatField(InvoiceItem.DATETRI, 8, false) +
					this.FormatField(InvoiceItem.QUALIFORIGINE, 3, false);
			}

			return ReturnString;
		},

		ConvertTaxCodes: function (dataSrc)
		{
			var lineItemTable = dataSrc.GetTable("LineItems__");
			for (var i = 0; i < lineItemTable.GetItemCount(); i++)
			{
				var line = lineItemTable.GetItem(i);
				this.AddTaxAmount(line.GetValue("TaxCode__"), line.GetValue("TaxAmount__"));
			}
		},

		AddLineItems: function (dataSrc, vendorHelperObj)
		{
			var out = "";
			//			var taxesArray = [];
			var lineItemTable = dataSrc.GetTable("LineItems__");
			for (var i = 0; i < lineItemTable.GetItemCount(); i++)
			{
				//G/L items
				var line = lineItemTable.GetItem(i);
				this.InitGLItem(dataSrc, line, true, vendorHelperObj);
				out += this.InvoiceItemToString() + EndLineSeparator;

				//Cost Center
				this.InitAnalyticItem(dataSrc, line, true, vendorHelperObj);
				out += this.InvoiceItemToString() + EndLineSeparator;
			}

			//Taxes
			for (var taxCode in this.g_taxAmountsArray)
			{
				this.ResetInvoiceItem();
				if (this.InitTaxItem(dataSrc, null, false, vendorHelperObj, taxCode, this.g_taxAmountsArray[taxCode].taxAmount))
				{
					out += this.InvoiceItemToString() + EndLineSeparator;
				}
			}

			return out;
		},

		// interface: all converters should implement the following methods

		/**
		* Returns the Header of the file (The header will be written first in the file)
		* @returns {string} The header of the file
		**/
		GetHeader: function ()
		{
			//Journal
			this.ResetJournal();
			return this.JournalToString() + EndLineSeparator;
		},

		/**
		* Converts the dataSrc into a string to be written in the result file (after the header, and before the footer)
		* @param {object} dataSrc The Data object of the document to convert
		* @returns {string} A string containing the converted data
		**/
		Convert: function (dataSrc)
		{
			if (!dataSrc)
			{
				return null;
			}

			var vendorHelperObj = this.GetVendorHelper(dataSrc);
			var out = "";
			this.ClearTaxAmounts();

			//Vendor Item
			this.InitVendorItem(dataSrc, vendorHelperObj);
			out += this.InvoiceItemToString() + EndLineSeparator;

			// Attachment is supposed to be a file path and not a link
			/*var imageURL = dataSrc.GetValue("ValidationUrl");
			if (imageURL)
			{
				InvoiceItem.SetGEDItem = "D";	//Document
				InvoiceItem.TYPECPTE = "G";	//GED

				imageURL = imageURL.replace("ManageDocumentsCheck.link", "attach.file");
				InvoiceItem.DOCUMENT = imageURL.replace("ruid=", "id=");

				out += this.InvoiceItemToString() + EndLineSeparator;
			}*/

			//Premier passage: liste des codes taxes
			this.ConvertTaxCodes(dataSrc);

			//Deuxième passage: génération des écritures
			out += this.AddLineItems(dataSrc, vendorHelperObj);

			return out;
		},

		/**
		* Returns the extension of the generated file
		* @returns {string} The extension of the generated file
		**/
		GetExtension: function ()
		{
			return "tra";
		},

		/**
		* Returns the encoding of the generated file
		* @returns {string} The encoding of the generated file
		**/
		GetEncoding: function ()
		{
			return "ansi";
		},

		/**
		* Returns the end of line format of the generated file
		* @returns {int} The format of the end of line (0 for Unix, 1 for Windows)
		**/
		GetEOLFormat: function ()
		{
			return Lib.FormDataConverter.EOL.Windows;
		}
	};

	Lib.FormDataConverter.Register("TRA_BUSINESS", formDataToTRA);
	Lib.FormDataConverter.Register("TRA_EXPERT", formDataToTRA);
	return formDataToTRA;
});