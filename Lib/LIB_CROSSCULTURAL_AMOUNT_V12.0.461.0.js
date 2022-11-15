/* LIB_DEFINITION{
  "name": "Lib_CrossCultural_Amount_V12.0.461.0",
  "require": []
}*/
var Lib;
Lib.CrossCultural.AddLib("Amount", function ()
{
	var CCAmount = {
		ConvertToAmountOrFormattedString: function (number, formatAsString, allowInteger, maxDecimal, fuzzy)
		{
			var results = [];
			var i;

			if (number === null || number.length === 0)
			{
				return results;
			}

			if (number.replace(/[^0-9]/g, "").length < number.replace(/[0-9]/g, "").length)
			{
				return results;
			}

			// 1- Store prefix info in case number is negative
			var negative = number.charAt(0) === '-';

			// 2- Fix common OCR errors
			// MFL20140901_2 - Erase "US$" part
			number = number.replace(/[A-Z]+\$/, '');
			number = number.replace(/[iIlt!|[\]\/]/g, '1');
			number = number.replace(/[oODQ]/g, '0');
			number = number.replace(/[z]/gi, '2');
			number = number.replace(/[A]/g, '4');
			number = number.replace(/[s]/gi, '5');
			number = number.replace(/[bG]/g, '6');
			number = number.replace(/[T]/g, '7');
			number = number.replace(/[B]/g, '8');
			number = number.replace(/[gq]/g, '9');
			number = number.replace(/[;,]/g, '.');

			// 3- Keep digits and dots only
			number = number.replace(/[^0123456789.]/g, "");

			if (number.charAt(0) === ".")
			{
				number = "0" + number;
			}

			// 4- Trim value left (remove non num)
			// E.g. :10,000 --> 10,000
			/*var firstNum = 0;
			while( firstNum < number.length && ( number.charAt( firstNum ) < '0' || number.charAt( firstNum ) > '9' ) ) {
			++firstNum;
			}
			if( firstNum > 0 ) {
			if( firstNum == number.length ) {
			return results;
			}
			number = number.substring( firstNum, number.length );
			}

			// 5- Trim value right (remove dots)
			// E.g. 10,000. --> 10,000
			var lastNum = 0;
			while( lastNum >= 0 && ( number.charAt( lastNum ) < '0' || number.charAt( lastNum ) > '9' ) ) {
			--lastNum;
			}
			if( lastNum > 0 ) {
			number = number.substring( 0, lastNum + 1 );
			}*/

			// 6- Calculate integer part and decimal parts
			var dotLastPosition = number.lastIndexOf('.');

			if (dotLastPosition !== -1)
			{
				if (dotLastPosition === number.length - 4 && allowInteger)
				{
					number = number.replace(/\./g, "");
				}
				else
				{
					if (maxDecimal > 0 && (number.length - dotLastPosition) > (maxDecimal + 1))
					{
						number = number.substring(0, dotLastPosition) + "#" + number.substr(dotLastPosition + 1, maxDecimal);
					}
					else
					{
						number = number.substring(0, dotLastPosition) + "#" + number.substring(dotLastPosition + 1, number.length);
					}
					number = number.replace(/\./g, "");
					number = number.replace('#', '.');
				}
			}

			// Build the number (non-fuzzy interpretation)
			if (negative)
			{
				number = '-' + number;
			}

			results.push(number);

			// Build the alternate candidates (fuzzy interpretation)
			if (fuzzy)
			{
				// May a be a misinterpreted $ sign
				if (number.charAt(0) === '5')
				{
					results.push(number.substr(1));
				}
				// 3 may be seen as a 9 by the OCR
				if (number.indexOf('9') !== -1)
				{
					for (i = 0; i < number.length; ++i)
					{
						if (number.charAt(i) === '9')
						{
							results.push(number.substring(0, i) + '3' + number.substr(i + 1));
						}
					}
				}
			}

			if (!formatAsString)
			{
				for (i = 0; i < results.length; ++i)
				{
					results[i] = parseFloat(results[i]);
				}
			}

			return results;
		}
	};

	return CCAmount;
});