/* LIB_DEFINITION{
  "name": "Lib_CrossCultural_Date_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.CrossCultural.AddLib("Date", function ()
{
	var TimeZones = {
		// As per dropdown list on EOD as of 2014-03-31
		// http://en.wikipedia.org/wiki/List_of_time_zone_abbreviations
		// http://en.wikipedia.org/wiki/List_of_time_zones_by_country
		// http://en.wikipedia.org/wiki/Daylight_saving_time_by_region_and_country
		// http://msdn.microsoft.com/en-us/library/gg154758.aspx

		// When daylightSavings:1, time zone is split between "Standard Time" and "Daylight Time"
		// "utcOffset" and "acronym" are always referencing the "Standard Time",
		// To have the utcOffset during "Daylight Time", just add 1
		"dateline standard time": {
			utcOffset: "-12:00",
			acronym: "BIT",
			id: "0",
			daylightSavings: 0
		},
		// International Date Line West (Baker Island)
		"samoa standard time": {
			utcOffset: "-11:00",
			acronym: "SST",
			id: "2510",
			daylightSavings: 0
		},
		// Midway Island, Samoa
		"utc-11": {
			utcOffset: "-11:00",
			acronym: "NZT",
			id: "110",
			daylightSavings: 0
		},
		// Coordinated Universal Time-11
		"hawaiian standard time": {
			utcOffset: "-10:00",
			acronym: "HAST",
			id: "200",
			daylightSavings: 0
		},
		// Hawaii
		"alaskan standard time": {
			utcOffset: "-09:00",
			acronym: "AKST",
			id: "300",
			daylightSavings: 1
		},
		// Alaska
		"pacific standard time": {
			utcOffset: "-08:00",
			acronym: "PST",
			id: "400",
			daylightSavings: 1
		},
		// Pacific Time (US & Canada); Tijuana
		"pacific Standard Time (mexico)": {
			utcOffset: "-08:00",
			acronym: "PST",
			id: "410",
			daylightSavings: 1
		},
		// Tijuana, Baja California
		"us mountain standard time": {
			utcOffset: "-07:00",
			acronym: "MST",
			id: "500",
			daylightSavings: 0
		},
		// Arizona
		"mountain Standard Time (mexico)": {
			utcOffset: "-07:00",
			acronym: "MST",
			id: "510",
			daylightSavings: 1
		},
		// Chihuahua, La Paz, Mazatlan
		"mountain standard time": {
			utcOffset: "-07:00",
			acronym: "MST",
			id: "520",
			daylightSavings: 1
		},
		// Mountain Time (US & Canada)
		"central america standard time": {
			utcOffset: "-06:00",
			acronym: "CST",
			id: "610",
			daylightSavings: 0
		},
		// Central America
		"central standard time (mexico)": {
			utcOffset: "-06:00",
			acronym: "CST",
			id: "630",
			daylightSavings: 1
		},
		// Central America (Mexico)
		"central standard time": {
			utcOffset: "-06:00",
			acronym: "CST",
			id: "620",
			daylightSavings: 1
		},
		// Central Time (US & Canada)
		"canada central standard time": {
			utcOffset: "-06:00",
			acronym: "CST",
			id: "600",
			daylightSavings: 0
		},
		// Saskatchewan
		"sa pacific standard time": {
			utcOffset: "-05:00",
			acronym: "PET",
			id: "710",
			daylightSavings: 0
		},
		// Bogota, Lima, Quito
		"eastern standard time": {
			utcOffset: "-05:00",
			acronym: "EST",
			id: "700",
			daylightSavings: 1
		},
		// Eastern Time (US & Canada)
		"us eastern standard time": {
			utcOffset: "-05:00",
			acronym: "EST",
			id: "720",
			daylightSavings: 1
		},
		// Indiana (East)
		"venezuela standard time": {
			utcOffset: "-04:30",
			acronym: "VET",
			id: "840",
			daylightSavings: 0
		},
		// Caracas
		"paraguay standard time": {
			utcOffset: "-04:00",
			acronym: "PYT",
			id: "850",
			daylightSavings: 1
		},
		// Asuncion
		"atlantic standard time": {
			utcOffset: "-04:00",
			acronym: "AST",
			id: "800",
			daylightSavings: 1
		},
		// Atlantic Time (Canada)
		"sa western standard time": {
			utcOffset: "-04:00",
			acronym: "BOT",
			id: "830",
			daylightSavings: 0
		},
		// La Paz
		"central brazilian standard time": {
			utcOffset: "-04:00",
			acronym: "AMT",
			id: "810",
			daylightSavings: 1
		},
		// Manaus
		"pacific sa standard time": {
			utcOffset: "-04:00",
			acronym: "CLT",
			id: "820",
			daylightSavings: 1
		},
		// Santiago
		"newfoundland standard time": {
			utcOffset: "-03:30",
			acronym: "NST",
			id: "900",
			daylightSavings: 1
		},
		// Newfoundland
		"e south america standard time": {
			utcOffset: "-03:00",
			acronym: "BRT",
			id: "910",
			daylightSavings: 1
		},
		// Brasilia
		"argentina standard time": {
			utcOffset: "-03:00",
			acronym: "ART",
			id: "950",
			daylightSavings: 0
		},
		// Buenos Aires
		"sa eastern standard time": {
			utcOffset: "-04:00",
			acronym: "GYT",
			id: "940",
			daylightSavings: 0
		},
		// Georgetown
		"greenland standard time": {
			utcOffset: "-03:00",
			acronym: "WGT",
			id: "920",
			daylightSavings: 1
		},
		// Greenland
		"montevideo standard time": {
			utcOffset: "-03:00",
			acronym: "UYT",
			id: "930",
			daylightSavings: 1
		},
		// Montevideo
		"bahia standard time": {
			utcOffset: "-03:00",
			acronym: "BRT",
			id: "910",
			daylightSavings: 1
		},
		// Salvador
		"utc-02": {
			utcOffset: "-02:00",
			acronym: "",
			id: "1010",
			daylightSavings: 0
		},
		// Coordinated Universal Time-02 (South Georgia and the South Sandwich Islands (UK))
		"mid-atlantic standard time": {
			utcOffset: "-02:00",
			acronym: "",
			id: "1000",
			daylightSavings: 0
		},
		// Mid-Atlantic (Brazil atlantic islands)
		"azores standard time": {
			utcOffset: "-01:00",
			acronym: "AZOT",
			id: "1100",
			daylightSavings: 1
		},
		// Azores
		"cape verde standard time": {
			utcOffset: "-01:00",
			acronym: "CVT",
			id: "1110",
			daylightSavings: 0
		},
		// Cape Verde Is.
		"morocco standard time": {
			utcOffset: "+00:00",
			acronym: "WET",
			id: "1220",
			daylightSavings: 1
		},
		// Casablanca
		"utc": {
			utcOffset: "+00:00",
			acronym: "UTC",
			id: "1230",
			daylightSavings: 0
		},
		// Coordinated Universal Time
		"gmt standard time": {
			utcOffset: "+00:00",
			acronym: "GMT",
			id: "1200",
			daylightSavings: 1
		},
		// Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London
		"greenwich standard time": {
			utcOffset: "+00:00",
			acronym: "WET",
			id: "1210",
			daylightSavings: 0
		},
		// Monrovia, Reykjavik
		"w europe standard time": {
			utcOffset: "+01:00",
			acronym: "CET",
			id: "1340",
			daylightSavings: 1
		},
		// Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna
		"central europe standard time": {
			utcOffset: "+01:00",
			acronym: "CET",
			id: "1300",
			daylightSavings: 1
		},
		// Belgrade, Bratislava, Budapest, Ljubljana, Prague
		"romance standard time": {
			utcOffset: "+01:00",
			acronym: "CET",
			id: "1320",
			daylightSavings: 1
		},
		// Brussels, Copenhagen, Madrid, Paris
		"central european standard time": {
			utcOffset: "+01:00",
			acronym: "CET",
			id: "1310",
			daylightSavings: 1
		},
		// Sarajevo, Skopje, Warsaw, Zagreb
		"w central africa standard time": {
			utcOffset: "+01:00",
			acronym: "WAT",
			id: "1330",
			daylightSavings: 0
		},
		// West Central Africa
		"namibia standard time": {
			utcOffset: "+01:00",
			acronym: "WAT",
			id: "1350",
			daylightSavings: 1
		},
		// Windhoek
		"turkey standard time": {
			utcOffset: "+02:00",
			acronym: "EET",
			id: "1490",
			daylightSavings: 1
		},
		// Istanbul
		"gtb standard time": {
			utcOffset: "+02:00",
			acronym: "EET",
			id: "1430",
			daylightSavings: 1
		},
		// Athens, Bucharest, Istanbul
		"middle east standard time": {
			utcOffset: "+02:00",
			acronym: "EET",
			id: "1460",
			daylightSavings: 1
		},
		// Beirut
		"egypt standard time": {
			utcOffset: "+02:00",
			acronym: "EST",
			id: "1410",
			daylightSavings: 0
		},
		// Cairo
		"syria standard time": {
			utcOffset: "+02:00",
			acronym: "EET",
			id: "1480",
			daylightSavings: 1
		},
		// Damascus
		"south africa standard time": {
			utcOffset: "+02:00",
			acronym: "SAST",
			id: "1470",
			daylightSavings: 0
		},
		// Harare, Pretoria
		"fle standard time": {
			utcOffset: "+02:00",
			acronym: "EET",
			id: "1420",
			daylightSavings: 1
		},
		// Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius
		"israel standard time": {
			utcOffset: "+02:00",
			acronym: "IST",
			id: "1440",
			daylightSavings: 1
		},
		// Jerusalem
		"e europe standard time": {
			utcOffset: "+03:00",
			acronym: "FET",
			id: "1400",
			daylightSavings: 0
		},
		// Minsk
		"kaliningrad standard time": {
			utcOffset: "+03:00",
			acronym: "FET",
			id: "1530",
			daylightSavings: 0
		},
		// Russia (Kaliningrad)
		"jordan standard time": {
			utcOffset: "+03:00",
			acronym: "AST",
			id: "1450",
			daylightSavings: 0
		},
		// Amman
		"arabic standard time": {
			utcOffset: "+03:00",
			acronym: "AST",
			id: "1510",
			daylightSavings: 0
		},
		// Baghdad
		"arab standard time": {
			utcOffset: "+03:00",
			acronym: "AST",
			id: "1500",
			daylightSavings: 0
		},
		// Kuwait, Riyadh
		"iran standard time": {
			utcOffset: "+03:30",
			acronym: "IRST",
			id: "1550",
			daylightSavings: 1
		},
		// Tehran
		"e africa standard time": {
			utcOffset: "+03:00",
			acronym: "EAT",
			id: "1520",
			daylightSavings: 0
		},
		// Nairobi
		"russian standard time": {
			utcOffset: "+04:00",
			acronym: "MSK",
			id: "1540",
			daylightSavings: 0
		},
		// Moscow, St. Petersburg, Volgograd
		"georgian standard time": {
			utcOffset: "+04:00",
			acronym: "GET",
			id: "1640",
			daylightSavings: 0
		},
		// Tbilisi
		"arabian standard time": {
			utcOffset: "+04:00",
			acronym: "GST",
			id: "1600",
			daylightSavings: 0
		},
		// Abu Dhabi, Muscat (Gulf)
		"azerbaijan standard time": {
			utcOffset: "+04:00",
			acronym: "AZT",
			id: "1610",
			daylightSavings: 1
		},
		// Baku
		"caucasus standard time": {
			utcOffset: "+04:00",
			acronym: "AMT",
			id: "1620",
			daylightSavings: 0
		},
		// Caucasus Standard Time (Armenia)
		"mauritius standard time": {
			utcOffset: "+04:00",
			acronym: "MUT",
			id: "1650",
			daylightSavings: 0
		},
		// Port Louis
		"afghanistan standard time": {
			utcOffset: "+04:30",
			acronym: "AFT",
			id: "1630",
			daylightSavings: 0
		},
		// Kabul
		"pakistan standard time": {
			utcOffset: "+05:00",
			acronym: "PKT",
			id: "1750",
			daylightSavings: 0
		},
		// Islamabad, Karachi
		"west asia standard time": {
			utcOffset: "+05:00",
			acronym: "UZT",
			id: "1710",
			daylightSavings: 0
		},
		// Tashkent
		"india standard time": {
			utcOffset: "+05:30",
			acronym: "IST",
			id: "1720",
			daylightSavings: 0
		},
		// Chennai, Kolkata, Mumbai, New Delhi
		"sri lanka standard time": {
			utcOffset: "+05:30",
			acronym: "SLST",
			id: "1730",
			daylightSavings: 0
		},
		// Sri Jayawardenepura
		"nepal standard time": {
			utcOffset: "+05:45",
			acronym: "NPT",
			id: "1740",
			daylightSavings: 0
		},
		// Kathmandu
		"ekaterinburg standard time": {
			utcOffset: "+06:00",
			acronym: "YEKT",
			id: "1700",
			daylightSavings: 0
		},
		// Ekaterinburg
		"central asia standard time": {
			utcOffset: "+06:00",
			acronym: "BTT",
			id: "1800",
			daylightSavings: 0
		},
		// Astana, Dhaka
		"bangladesh standard time": {
			utcOffset: "+06:00",
			acronym: "BST",
			id: "1830",
			daylightSavings: 0
		},
		// Dhaka
		"n central asia standard time": {
			utcOffset: "+06:00",
			acronym: "ALMT",
			id: "1810",
			daylightSavings: 0
		},
		// Almaty, Novosibirsk
		"myanmar standard time": {
			utcOffset: "+06:30",
			acronym: "MST",
			id: "1820",
			daylightSavings: 0
		},
		// Rangoon
		"se asia standard time": {
			utcOffset: "+07:00",
			acronym: "ICT",
			id: "1910",
			daylightSavings: 0
		},
		// Bangkok, Hanoi, Jakarta
		"north asia standard time": {
			utcOffset: "+08:00",
			acronym: "KRAT",
			id: "1900",
			daylightSavings: 0
		},
		// Krasnoyarsk
		"china standard time": {
			utcOffset: "+08:00",
			acronym: "CST",
			id: "2000",
			daylightSavings: 0
		},
		// Beijing, Chongqing, Hong Kong, Urumqi
		"singapore standard time": {
			utcOffset: "+08:00",
			acronym: "SST",
			id: "2020",
			daylightSavings: 0
		},
		// Kuala Lumpur, Singapore
		"w australia standard time": {
			utcOffset: "+08:00",
			acronym: "AWST",
			id: "2040",
			daylightSavings: 0
		},
		// Perth
		"taipei standard time": {
			utcOffset: "+08:00",
			acronym: "CST",
			id: "2030",
			daylightSavings: 0
		},
		// Taipei
		"ulaanbaatar standard time": {
			utcOffset: "+08:00",
			acronym: "ULAT",
			id: "2050",
			daylightSavings: 0
		},
		// Ulaan Bataar
		"north asia east standard time": {
			utcOffset: "+08:00",
			acronym: "IRKT",
			id: "2010",
			daylightSavings: 0
		},
		// Irkutsk
		"tokyo standard time": {
			utcOffset: "+09:00",
			acronym: "JST",
			id: "2110",
			daylightSavings: 0
		},
		// Osaka, Sapporo, Tokyo
		"korea standard time": {
			utcOffset: "+09:00",
			acronym: "KST",
			id: "2100",
			daylightSavings: 0
		},
		// Seoul
		"cen australia standard time": {
			utcOffset: "+09:30",
			acronym: "ACST",
			id: "2140",
			daylightSavings: 1
		},
		// Adelaide
		"aus central standard time": {
			utcOffset: "+09:30",
			acronym: "ACST",
			id: "2130",
			daylightSavings: 0
		},
		// Darwin
		"yakutsk standard time": {
			utcOffset: "+10:00",
			acronym: "YAKT",
			id: "2120",
			daylightSavings: 0
		},
		// Yakutsk
		"e australia standard time": {
			utcOffset: "+10:00",
			acronym: "AEST",
			id: "2210",
			daylightSavings: 0
		},
		// Brisbane
		"aus eastern standard time": {
			utcOffset: "+10:00",
			acronym: "AEST",
			id: "2200",
			daylightSavings: 1
		},
		// Canberra, Melbourne, Sydney
		"west pacific standard time": {
			utcOffset: "+10:00",
			acronym: "ChST",
			id: "2240",
			daylightSavings: 0
		},
		// Guam, Port Moresby
		"tasmania standard time": {
			utcOffset: "+10:00",
			acronym: "AEST",
			id: "2220",
			daylightSavings: 1
		},
		// Hobart
		"vladivostok standard time": {
			utcOffset: "+10:00",
			acronym: "VLAT",
			id: "2230",
			daylightSavings: 0
		},
		// Vladivostok
		"central pacific standard time": {
			utcOffset: "+11:00",
			acronym: "NCT",
			id: "2300",
			daylightSavings: 0
		},
		// Solomon Is., New Caledonia
		"magadan standard time": {
			utcOffset: "+11:00",
			acronym: "MAGT",
			id: "2310",
			daylightSavings: 0
		},
		// Magadan
		"new zealand standard time": {
			utcOffset: "+12:00",
			acronym: "NZST",
			id: "2410",
			daylightSavings: 1
		},
		// Auckland, Wellington
		"utc+12": {
			utcOffset: "+12:00",
			acronym: "",
			id: "2430",
			daylightSavings: 0
		},
		// Coordinated Universal Time+12
		"fiji standard time": {
			utcOffset: "+12:00",
			acronym: "FJT",
			id: "2400",
			daylightSavings: 0
		},
		// Fiji, Kamchatka, Marshall Is.
		"kamchatka standard time": {
			utcOffset: "+12:00",
			acronym: "MAGT",
			id: "2310",
			daylightSavings: 0
		},
		// Petropavlovsk-Kamchatsky
		"tonga standard time": {
			utcOffset: "+13:00",
			acronym: "TOT",
			id: "2500",
			daylightSavings: 0
		}
		// Nuku'alofa
	};

	// supported month names - without accents
	var MonthNames = [
	/*EN*/["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
	/*FR*/["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre", "janv", "fevr", "mars", "avr", "mai", "juin", "jul", "aout", "sept", "oct", "nov", "dec"],
	/*IT*/["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
	/*ES*/["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", "enero", "feb", "marzo", "abr", "mayo", "jun", "jul", "agosto", "sept", "oct", "nov", "dic"],
	/*DE*/["januar", "februar", "marz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember", "jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"],
	/*AT*/["janner", "feber", "marz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember", "jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"],
	/*NL*/["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december", "jan", "feb", "maart", "apr", "mei", "juni", "juli", "aug", "sept", "oct", "nov", "dec"],
	/*PT*/["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "septembro", "outubro", "novembro", "dezembro", "jan", "fev", "marco", "abril", "maio", "junho", "julho", "agosto", "set", "out", "nov", "dez"],
	/*MY*/["januari", "februari", "mac", "april", "mei", "jun", "julai", "ogos", "september", "oktober", "november", "disember", "jan", "feb", "mac", "apr", "mei", "jun", "jul", "ogo", "sep", "okt", "nov", "dis"]];
	// See http://www.omniglot.com/language/time/days.htm
	var DayNames = [
	/*EN*/["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	/*FR*/["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"/*,"Dim","Lun","Mar","Mer","Jeu","Ven","Sam"*/],
	/*IT*/["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"/*,"Dom","Lun","Mar","Mer","Gio","Ven","Sab"*/],
	/*DE*/["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"/*,"So","Mo","Di","Mi","Do","Fr","Sa"*/],
	/*ES*/["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"/*,"Dom","Lun","Mar","Mie","Jue","Vie","Sáb"*/],
	/*NL*/["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"/*,"Zo","Ma","Di","Wo","Do","Vr","Za"*/],
	/*PT*/["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"/*,"Dom","Seg","Ter","Qua","Qui","Sex","Sab"*/],
	/*MY*/["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"]];

	// ------------------------------------------------------------------
	// Utility functions for parsing in getDateTimeFromFormat()
	// ------------------------------------------------------------------
	function _isInteger(val)
	{
		var digits = "1234567890";
		for (var i = 0; i < val.length; i++)
		{
			if (digits.indexOf(val.charAt(i)) === -1)
			{
				return false;
			}
		}
		return true;
	}

	function _getInt(str, i, minlength, maxlength)
	{
		for (var x = maxlength; x >= minlength; x--)
		{
			var token = str.substring(i, i + x);
			if (token.length < minlength)
			{
				return null;
			}

			if (_isInteger(token))
			{
				return token;
			}
		}
		return null;
	}

	var CCDate = {
		// MFL20140821_1 - ConvertToDateOrFormattedString: Remove keyword if attached
		CompareDates: function (date1, date2)
		{
			if (!date1 || !date1.getTime || !date2 || !date2.getTime)
			{
				return null;
			}

			var result = null;
			if (date1.getTime() < date2.getTime())
			{
				result = -1;
			} else if (date1.getTime() > date2.getTime())
			{
				result = 1;
			} else
			{
				result = 0;
			}
			return result;
		},

		GetServer2ClientTimeOffset: function (UTC2ServerOffset, UTC2ClientOffset)
		{
			var UTC2ServerMinuteOffset = parseInt(UTC2ServerOffset, 10);
			var UTC2ClientMinuteOffset = parseInt(UTC2ClientOffset, 10);
			var Client2ServerMinuteOffset = 0;
			// Default when the two values are identical
			if (Number.isInteger(UTC2ServerMinuteOffset) && Number.isInteger(UTC2ClientMinuteOffset))
			{
				if (UTC2ServerMinuteOffset !== UTC2ClientMinuteOffset)
				{
					Client2ServerMinuteOffset = UTC2ServerMinuteOffset - UTC2ClientMinuteOffset;
				}
				if ((UTC2ServerMinuteOffset < 0 && UTC2ClientMinuteOffset > 0) || (UTC2ServerMinuteOffset > 0 && UTC2ClientMinuteOffset < 0))
				{
					// Only two scenarios where the above formula does not suffice
					Client2ServerMinuteOffset = Math.abs(Client2ServerMinuteOffset);
				}
			}
			return Client2ServerMinuteOffset;
		},

		GetTimeZoneFromName: function (name)
		{
			name = name.toLowerCase().replace(/\./g, '');
			// cleanup
			if (name in TimeZones)
			{
				return TimeZones[name];
			} else
			{
				return null;
			}
		},

		// inputFormat can be "dMy", "Mdy" or "yMd"
		// inputSeparator can be "/", "-", "." or " "
		// outputFormat must contain the inputSeparator and only 1 d char, 1 M char and 1 y char
		// limitation: month must use digits only (no letters)
		ConvertDateFormat: function (value, inputFormat, inputSeparator, outputFormat)
		{
			if (value.length && inputFormat.length && inputSeparator.length && outputFormat.length)
			{
				var year, month, date;
				var splitInputDate = value.split(inputSeparator);
				if (inputFormat.toLowerCase() === "dmy")
				{
					year = splitInputDate[2];
					month = splitInputDate[1];
					date = splitInputDate[0];
				} else if (inputFormat.toLowerCase() === "mdy")
				{
					year = splitInputDate[2];
					month = splitInputDate[0];
					date = splitInputDate[1];
				} else if (inputFormat.toLowerCase() === "ymd")
				{
					year = splitInputDate[0];
					month = splitInputDate[1];
					date = splitInputDate[2];
				} else
				{
					return value;
				}

				if (year.length === 2)
				{
					year = "20" + year;
				}
				if (month.length === 1)
				{
					month = "0" + month;
				}
				if (date.length === 1)
				{
					date = "0" + date;
				}

				// Formatting output date
				outputFormat = outputFormat.toLowerCase();
				outputFormat = outputFormat.replace('d', date);
				outputFormat = outputFormat.replace('m', month);
				outputFormat = outputFormat.replace('y', year);
				return outputFormat;
			}
			return value;
		},

		// ------------------------------------------------------------------
		// Re-using JS library which can be found at the following URL:
		// http://www.mattkruse.com/javascript/date/source.html
		// ------------------------------------------------------------------
		LZ: function (x)
		{
			return (x < 0 || x > 9 ? "" : "0") + x;
		},

		// ------------------------------------------------------------------
		// getDateTimeFromFormat( date_string , format_string )
		// This function takes a date string and a format string. It matches
		// If the date string matches the format string, it returns the
		// getTime() of the date. If it does not match, it returns 0.
		// ------------------------------------------------------------------
		getDateTimeFromFormat: function (val, format)
		{
			val = val + "";
			format = format + "";
			var i_val = 0;
			var i_format = 0;
			var c = "";
			var token = "";
			//var token2="";
			var x, y;
			var now = new Date();
			var year = now.getYear();
			var month = now.getMonth() + 1;
			var date = 1;
			var hh = now.getHours();
			var mm = now.getMinutes();
			var ss = now.getSeconds();
			var ampm = "";
			var i;

			while (i_format < format.length)
			{
				// Get next token from format string
				c = format.charAt(i_format);
				token = "";
				while ((format.charAt(i_format) === c) && (i_format < format.length))
				{
					token += format.charAt(i_format++);
				}
				// Extract contents of value based on format token
				if (token === "yyyy" || token === "yy" || token === "y")
				{
					if (token === "yyyy")
					{
						x = 4;
						y = 4;
					}
					if (token === "yy")
					{
						x = 2;
						y = 2;
					}
					if (token === "y")
					{
						x = 2;
						y = 4;
					}
					year = _getInt(val, i_val, x, y);
					if (year === null)
					{
						return 0;
					}
					i_val += year.length;
					if (year.length === 2)
					{
						if (year > 70)
						{
							year = 1900 + (year - 0);
						} else
						{
							year = 2000 + (year - 0);
						}
					}
				} else if (token === "MMM" || token === "NNN")
				{
					month = 0;
					var month_len = 0;
					for (var j = 0; j < MonthNames.length; j++)
					{
						for (i = 0; i < MonthNames[j].length; i++)
						{
							var month_name = MonthNames[j][i];
							if (month_name.length > month_len)
							{
								if (val.substring(i_val, i_val + month_name.length).toLowerCase() === month_name.toLowerCase())
								{
									if (token === "MMM" || (token === "NNN" && i > 11))
									{
										month = i + 1;
										if (month > 12)
										{
											month -= 12;
										}
										month_len = month_name.length;
									}
								}
							}
						}
					}
					if ((month < 1) || (month > 12))
					{
						return 0;
					}
					i_val += month_len;
				} else if (token === "EE" || token === "E")
				{
					for (i = 0; i < DayNames.length; i++)
					{
						var day_name = DayNames[i];
						if (val.substring(i_val, i_val + day_name.length).toLowerCase() === day_name.toLowerCase())
						{
							i_val += day_name.length;
							break;
						}
					}
				} else if (token === "MM" || token === "M")
				{
					month = _getInt(val, i_val, token.length, 2);
					if (month === null || (month < 1) || (month > 12))
					{
						return 0;
					}
					i_val += month.length;
				} else if (token === "dd" || token === "d")
				{
					date = _getInt(val, i_val, token.length, 2);
					if (date === null || (date < 1) || (date > 31))
					{
						return 0;
					}
					i_val += date.length;
				} else if (token === "hh" || token === "h")
				{
					hh = _getInt(val, i_val, token.length, 2);
					if (hh === null || (hh < 1) || (hh > 12))
					{
						return 0;
					}
					i_val += hh.length;
				} else if (token === "HH" || token === "H")
				{
					hh = _getInt(val, i_val, token.length, 2);
					if (hh === null || (hh < 0) || (hh > 23))
					{
						return 0;
					}
					i_val += hh.length;
				} else if (token === "KK" || token === "K")
				{
					hh = _getInt(val, i_val, token.length, 2);
					if (hh === null || (hh < 0) || (hh > 11))
					{
						return 0;
					}
					i_val += hh.length;
				} else if (token === "kk" || token === "k")
				{
					hh = _getInt(val, i_val, token.length, 2);
					if (hh === null || (hh < 1) || (hh > 24))
					{
						return 0;
					}
					i_val += hh.length;
					hh--;
				} else if (token === "mm" || token === "m")
				{
					mm = _getInt(val, i_val, token.length, 2);
					if (mm === null || (mm < 0) || (mm > 59))
					{
						return 0;
					}
					i_val += mm.length;
				} else if (token === "ss" || token === "s")
				{
					ss = _getInt(val, i_val, token.length, 2);
					if (ss === null || (ss < 0) || (ss > 59))
					{
						return 0;
					}
					i_val += ss.length;
				} else if (token === "a")
				{
					if (val.substring(i_val, i_val + 2).toLowerCase() === "am")
					{
						ampm = "AM";
					} else if (val.substring(i_val, i_val + 2).toLowerCase() === "pm")
					{
						ampm = "PM";
					} else
					{
						return 0;
					}
					i_val += 2;
				} else
				{
					if (val.substring(i_val, i_val + token.length) !== token)
					{
						return 0;
					} else
					{
						i_val += token.length;
					}
				}
			}
			// If there are any trailing characters left in the value, it doesn't match
			if (i_val !== val.length)
			{
				return 0;
			}
			// Is date valid for month?
			if (month === 2)
			{
				// Check for leap year
				if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
				{
					// leap year
					if (date > 29)
					{
						return 0;
					}
				} else
				{
					if (date > 28)
					{
						return 0;
					}
				}
			}
			if ((month === 4) || (month === 6) || (month === 9) || (month === 11))
			{
				if (date > 30)
				{
					return 0;
				}
			}
			// Correct hours value
			if (hh < 12 && ampm === "PM")
			{
				hh = hh - 0 + 12;
			} else if (hh > 11 && ampm === "AM")
			{
				hh -= 12;
			}

			var newdate = new Date(year, month - 1, date, hh, mm, ss);
			return newdate.getTime();
		},

		// ------------------------------------------------------------------
		// parseDate( date_string [, prefer_euro_format] )
		// This function takes a date string and tries to match it to a
		// number of possible date formats to get the value. It will try to
		// match against international formats, in the provided order
		// A second argument may be passed to instruct the method to search
		// for formats like d/M/y (european format) before M/d/y (American).
		// Returns a Date object or null if no patterns match.
		// ------------------------------------------------------------------
		parseDate: function (value, monthBeforeDate)
		{
			var checkList = [["yyyy-M-d", "yyyy.M.d", "yyyy/M/d", "MMM d y", "MMM.d y", "d-MMM-y", "y-MMM-d", "d/MMM/y", "d.MMM.y", "d MMM y", "d. MMM y", "d.MMM y", "MMM d"], ["d/M/y", "d-M-y", "d.M.y", "d M y", "d-MMM", "d/M", "d-M"], ["M/d/y", "M-d-y", "M.d.y", "M d y", "MMM-d", "M/d", "M-d"]];

			if (monthBeforeDate)
			{
				var buf = checkList[1];
				checkList[1] = checkList[2];
				checkList[2] = buf;
			}
			for (var i = 0; i < checkList.length; ++i)
			{
				var l = checkList[i];
				for (var j = 0; j < l.length; ++j)
				{
					var d = this.getDateTimeFromFormat(value, l[j]);
					if (d !== 0)
					{
						return new Date(d);
					}
				}
			}
			return null;
		},

		// ------------------------------------------------------------------
		// formatDateTime( date_object, format )
		// Returns a date in the output format specified.
		// The format string uses the same abbreviations as in getDateTimeFromFormat()
		// ------------------------------------------------------------------
		formatDateTime: function (date, format)
		{
			if (!(date instanceof Date))
			{
				return "";
			}
			format = format + "";
			var result = "";
			var i_format = 0;
			var c = "";
			var token = "";
			var y = date.getYear() + "";
			var M = date.getMonth() + 1;
			var d = date.getDate();
			var E = date.getDay();
			var H = date.getHours();
			var m = date.getMinutes();
			var s = date.getSeconds();
			//var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
			// Convert real date parts into formatted versions
			var value = {};
			if (y.length < 4)
			{
				y = "" + (y - 0 + 1900);
			}
			value["y"] = "" + y;
			value["yyyy"] = y;
			value["yy"] = y.substring(2, 4);
			value["M"] = M;
			value["MM"] = this.LZ(M);
			value["MMM"] = MonthNames[0][M - 1];
			value["NNN"] = MonthNames[0][M + 11];
			value["d"] = d;
			value["dd"] = this.LZ(d);
			value["E"] = DayNames[E + 7];
			value["EE"] = DayNames[E];
			value["H"] = H;
			value["HH"] = this.LZ(H);
			if (H === 0)
			{
				value["h"] = 12;
			} else if (H > 12)
			{
				value["h"] = H - 12;
			} else
			{
				value["h"] = H;
			}
			value["hh"] = this.LZ(value["h"]);
			if (H > 11)
			{
				value["K"] = H - 12;
			} else
			{
				value["K"] = H;
			}
			value["k"] = H + 1;
			value["KK"] = this.LZ(value["K"]);
			value["kk"] = this.LZ(value["k"]);
			if (H > 11)
			{
				value["a"] = "PM";
			} else
			{
				value["a"] = "AM";
			}
			value["m"] = m;
			value["mm"] = this.LZ(m);
			value["s"] = s;
			value["ss"] = this.LZ(s);
			while (i_format < format.length)
			{
				c = format.charAt(i_format);
				token = "";
				while ((format.charAt(i_format) === c) && (i_format < format.length))
				{
					token += format.charAt(i_format++);
				}
				if (value.hasOwnProperty(token))
				{
					result = result + value[token];
				} else
				{
					result = result + token;
				}
			}
			return result;
		},

		ConvertToDateOrFormattedString: function (value, format, monthBeforeDate, fuzzy)
		{
			var results = [];
			var i, j;
			if (value !== null && value.length > 0)
			{
				// Clean text and fix common OCR errors
				// Handle date separators
				value = value.replace(/[`´ˋˊʻʽʼʾʿˈ¹ˑ῾˘˙˹˺᾽῀῁`´‘’‛′]/g, "'");
				value = value.replace(/[ˌˎˏ٬٫˒˓˔˕·¸˛˖ˬ˯˰˱˲˳˴˻˼͵]/g, ".");
				value = value.replace(/[~__̶˗–­‒–—―]/g, "-");

				value = value.replace(/[äá]/g, "a");
				value = value.replace(/é/g, "e");
				value = value.replace(/û/g, "u");
				value = value.replace(/ç/g, "c");

				// Handle OCR confusions with 0 and 1
				value = value.replace(/([^0-9])2[O0][I1l!\|]([0-9])/, "$1201$2");
				value = value.replace(/([^0-9])2O([0-9]{2})/, "$120$2");
				value = value.replace(/([^0-9])6([0-9][^0-9])/g, "$10$2");
				value = value.replace(/^6([0-9][^0-9])/g, "0$1");
				value = value.replace(/\bN0V/i, 'NOV');
				value = value.replace(/\b0CT/i, 'OCT');
				value = value.replace(/\bao0t/i, 'aout');
				// "NOVEMBER"

				// Handle OCR confusion with 引 and 31, . and 0
				value = value.replace(/引/g, '31');
				value = value.replace(/年(.*)\.(.*)(月|⽉)/, "年$10$2$3");
				value = value.replace(/(月|⽉)(.*)\.(.*)日/, "$1$20$3日");
				value = value.replace(/(平)\s(成)/, "平成");
				value = value.replace(/(平成).*([0-9]{1})\s([0-9]{1}).*(年)/, "$1$2$3$4");

				// Remove unnecessary characters
				value = value.replace(/[',]([0-9]{2})( |$)/m, "$1$2");
				value = value.replace(/([0-9A-Z]) ?([-\/\.]) ?([0-9A-Z])/gi, "$1$2$3");
				value = value.replace(/^O([0-9])(-|\/|\.| |[A-Z]{3,})/i, "0$1$2");
				value = value.replace(/([0-9]+)[ ]?(st|nd|rd|th)/i, "$1");
				value = value.replace(/([,][ ]?)([0-9]{2,4})/, " $2");
				value = value.replace(/^[A-Z]+:([0-9]+[^0-9]+[0-9]+[^0-9]+[0-9]+)$/gi, "$1");
				value = value.replace(/ de /gi, "");

				// Remove day of the week
				for (j = 0; j < DayNames.length; j++)
				{
					for (i = 0; i < DayNames[j].length; i++)
					{
						var dayName = new RegExp(DayNames[j][i], "i");
						value = value.replace(dayName, "");
					}
				}

				// MFL20140821_1 Remove keyword if attached
				value = value.replace(/^[A-Z]+:([0-9]{1,4}[-/\. ]([0-9]{1,2}|[A-Z]+)[-/\. ][0-9]{1,4})$/i, "$1");

				// Handle OCR confusions with separators
				value = value.replace(/([0-9])([A-Z]{3,})([0-9])/i, "$1/$2/$3");
				value = value.replace(/^([0-9]{1,2})[1\/\(]([A-Za-z]{3,4})[.]?[1\/\(]([0-9]{2,4})$/, "$1/$2/$3");
				value = value.replace(/^([0-9]{1,2})[,:\.]([A-Za-z]{3,4})[,:\.]([0-9]{2,4})$/, "$1.$2.$3");
				value = value.replace(/^([0-9]{1,2})[1\/\(]([0-9]{1,2})[1\/\(]([0-9]{2,4})$/, "$1/$2/$3");
				value = value.replace(/^([0-9]{1,2})[,:\.]([0-9]{1,2})[,:\.]?([0-9]{2,4})$/, "$1.$2.$3");
				value = value.replace(/([0-9]+)([A-Z]+)/i, "$1 $2");
				value = value.replace(/([A-Z]+)([0-9]+)/i, "$1 $2");

				// Fix common OCR errors - to be replaced by upper commented blocks
				/*value = value.replace( /^([0-9]{1,2})[1\/\(]([A-Za-z]{3,4})[.]?[1\/\(]([0-9]{2,4})$/, "$1/$2/$3" );
				value = value.replace( /^([0-9]{1,2})[,:\.]([A-Za-z]{3,4})[,:\.]([0-9]{2,4})$/, "$1.$2.$3" );
				value = value.replace( /^([0-9]{1,2})[1\/\(]([0-9]{1,2})[1\/\(]([0-9]{2,4})$/, "$1/$2/$3" );
				value = value.replace( /^([0-9]{1,2})[,:\.]([0-9]{1,2})[,:\.]([0-9]{2,4})$/, "$1.$2.$3" );
				value = value.replace( /([^0-9])6([0-9][^0-9])/g, "$10$2" );
				value = value.replace( /^6([0-9][^0-9])/g, "0$1" );
				value = value.replace( /^[A-Z]+:([0-9]+[^0-9]+[0-9]+[^0-9]+[0-9]+)$/gi, "$1" );
				value = value.replace( /([0-9]+)[ ]?(st|nd|rd|th)/i, "$1" );
				value = value.replace( /\bN0V\b/i, 'NOV' ); // "NOVEMBER"
				value = value.replace( /([0-9]+)([A-Z]+)/i, "$1 $2" );
				value = value.replace( /([A-Z]+)([0-9]+)/i, "$1 $2" );
				value = value.replace( /([,][ ]?)([0-9]{2,4})/, " $2" );
				value = value.replace( /\'([0-9]{2})( |$)/m, "$1$2" );
				value = value.replace( /  /g, " " );*/

				// Handle Asian date formats
				// Convert Japanese Emperor year to normal Gregorian calendar year
				var year, rest;
				if (value.indexOf("平成") > -1 || value.match(/H ?[0-9]{1,2} ?年/))
				{
					// Heisei era
					if (value.indexOf("平成") > -1)
					{
						year = value.replace(/平成 ?([0-9]{2})/, "$1");
						rest = value.replace(/平成 ?([0-9]{2}) ?/, "");
					}
					else
					{
						year = value.replace(/H ?([0-9]{2})/, "$1");
						rest = value.replace(/H ?([0-9]{2}) ?/, "");
					}
					// 1989 was the first year of the Heisei era
					year = parseInt(year, 10) + 1988;
					value = year + rest;

					monthBeforeDate = true;
				}
				else if (value.indexOf("令和") > -1 || value.match(/R ?[0-9]{1,2} ?年/))
				{
					// Reiwa era
					if (value.match(/令和 ?元/))
					{
						year = 1;
						rest = value.replace(/令和 ?元 ?/, "");
					}
					else if (value.indexOf("令和") > -1)
					{
						year = value.replace(/令和 ?([0-9]{1,2})/, "$1");
						rest = value.replace(/令和 ?([0-9]{1,2}) ?/, "");
					}
					else
					{
						year = value.replace(/R ?([0-9]{1,2})/, "$1");
						rest = value.replace(/R ?([0-9]{1,2}) ?/, "");
					}
					// 2019 was the first year of the Reiwa era
					year = parseInt(year, 10) + 2018;
					value = year + rest;

					monthBeforeDate = true;
				}

				value = value.replace(/([0-9]{4}) ?年 ?/, "$1-");
				// Convert chinese/japanese formats to yyyy-MM-dd
				value = value.replace(/([0-9]{4}) ?년 ?/, "$1-");
				// Convert korean format to yyyy-MM-dd
				value = value.replace(/([0-9]{2}) ?年 ?/, "20$1-");
				// Convert chinese/japanese formats to yyyy-MM-dd
				value = value.replace(/([0-9]{2}) ?년 ?/, "20$1-");
				// Convert korean format to yyyy-MM-dd
				value = value.replace(/ ?(月|⽉) ?/, "-");
				// Convert chinese/japanese formats to yyyy-MM-dd
				value = value.replace(/ ?월 ?/, "-");
				// Convert korean format to yyyy-MM-dd
				value = value.replace(/ ?日 ?/, "");
				// Convert chinese/japanese formats to yyyy-MM-dd
				value = value.replace(/ ?일 ?/, "");
				// Convert korean format to yyyy-MM-dd

				// Trim value
				while (value.length > 1 && ((value.charAt(0) < "0" || value.charAt(0) > "9") && (value.charAt(0) < "A" || value.charAt(0) > "Z") && (value.charAt(0) < "a" || value.charAt(0) > "z")))
				{
					value = value.substring(1, value.length);
				}
				while (value.length > 1 && (value.charAt(value.length - 1) < "0" || value.charAt(value.length - 1) > "9"))
				{
					value = value.substring(0, value.length - 1);
				}

				var values = [];

				// Handle special case where dd and yy can both lead to valid dates
				if (!monthBeforeDate && /^([0-9]{1,2})([-\.\/ ])([0-9]{1,2}|[A-Z]{3,})([-\.\/ ])([0-9]{1,2})$/.test(value))
				{
					var candidate1 = value.replace(/^([0-9]{1,2})([-\.\/ ])([0-9]{1,2}|[A-Z]{3,})([-\.\/ ])([0-9]{1,2})$/, "20$1-$3-$5");
					// E.g. 04-11-14
					var candidate2 = value.replace(/^([0-9]{1,2})([-\.\/ ])([0-9]{1,2}|[A-Z]{3,})([-\.\/ ])([0-9]{1,2})$/, "20$5-$3-$1");
					// E.g. 14-11-04
					values.push(candidate2);
					// E.g. 14-11-04
					values.push(candidate1);
					// E.g. 04-11-14
				} else
				{
					values.push(value);
				}

				if (fuzzy)
				{
					// 3 may be seen as a 9 by the OCR
					if (value.indexOf("9") !== -1)
					{
						for (i = 0; i < value.length; ++i)
						{
							if (value.charAt(i) === "9")
							{
								values.push(value.substring(0, i) + "3" + value.substr(i + 1));
							}
						}
					}
				}

				for (j = 0; j < values.length; ++j)
				{
					var convertValueIntoDate = this.parseDate(values[j], monthBeforeDate);
					if (convertValueIntoDate !== null)
					{
						if (format !== null && format.length > 0)
						{
							var result = this.formatDateTime(convertValueIntoDate, format);
							if (result.length > 0)
							{
								results.push(result);
							}
						} else
						{
							results.push(convertValueIntoDate);
						}
					}
				}
			}

			return results;
		}
	};

	return CCDate;
});