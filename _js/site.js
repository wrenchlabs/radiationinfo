var radiation = {
	// Conversion factors for each unit.
	units: ['sievert', 'gray', 'rem'],
	unitvalues: [1, 1, 100],

	// These are consistent in ratio for all unit types.
	prefixes: ['', 'milli', 'micro'],
	prefixvalues: [1, .001, .000001],
	
	// Handle timespans, expressed in terms of multiples of the previous index.
	rates: ['instant', 'hour','day','week','month','year'],
	rateslookup: {instant:0, hour:1,day:2,week:3,month:4,year:5},
	ratevalues: [1,60,24,7,(365/12/7),12],
	
	// Arrays of possible text values for units and prefixes, stored at their lookup index.
	forwardlookup: [
		// Sieverts
		[
			['Sv', 'sievert', 'sieverts'],
			['mSv', 'millisievert', 'milli-sievert', 'millisieverts', 'milli-sieverts'],
			['μSv', 'microsievert', 'micro-sievert', 'microsieverts', 'micro-sieverts']
		],

		// Grays
		[
			['Gy', 'gray', 'grays'],
			['mGy', 'milligray', 'milli-gray', 'milligrays', 'milli-grays'],
			['μGy', 'microgray', 'micro-gray', 'micrograys', 'micro-grays']
		],

		// Rems
		[
			['rem', 'rems'],
			['mrem', 'millirem', 'milli-rem', 'millirems', 'milli-rems'],
			['μrem', 'microrem', 'micro-rem', 'microrems', 'micro-rems']
		]
	],
	
	significantdigits: [
		// Sieverts
		[
			6, // Sv
			3, // mSv
			0 // μSv
		],

		// Grays
		[
			6, // Gy
			3, // mGy
			0 // μGy
		],

		// Rems
		[
			4, // rem
			1, // mrem
			0 // μrem
		]
	],
	
	// Generated from forwardlookup on run.
	// Allows going from a text value to [unit lookup, prefix lookup].
	reverselookup: {},
	unitstrings: [],
	
	generatelookups: function() {
		for (var unit = 0; unit < radiation.forwardlookup.length; unit++) {
			for (var prefix = 0; prefix < radiation.forwardlookup[unit].length; prefix++) {
				for (var string = 0; string < radiation.forwardlookup[unit][prefix].length; string++) {
					radiation.reverselookup[radiation.forwardlookup[unit][prefix][string]] = [unit, prefix];
					radiation.unitstrings.push(radiation.forwardlookup[unit][prefix][string]);
				}
			}
		}
	},

	unitkey: function(unit) {
		if (typeof unit == 'string') {
			unit =  radiation.reverselookup[unit];
		}
		return radiation.forwardlookup[unit[0]][unit[1]][0];
	},
	
	getsignificantdigits: function(unit) {
		if (typeof unit == 'string') {
			unit =  radiation.reverselookup[unit];
		}
		return radiation.significantdigits[unit[0]][unit[1]];
	},
	
	calcsignificantdigits: function(level, untruncated) {
		var significantdigits = radiation.getsignificantdigits(level.unit);
		if (untruncated) { significantdigits += 2; }
		level.level = Math.round(level.level*Math.pow(10,significantdigits))/Math.pow(10,significantdigits);
		return level;
	},
	
	// Take a value in one unit and convert it to another unit.
	convert: function(level, from, to, untruncated) {
		// level = currently specified value
		// from, to = string or [unit coefficient lookup, prefix coefficient lookup]
		if (typeof from == 'string') {
			from =  radiation.reverselookup[from];
		}
		if (typeof to == 'string') {
			to =  radiation.reverselookup[to];
		}
		var results = {};
		results.level = (level / radiation.unitvalues[from[0]] * radiation.prefixvalues[from[1]]) * (radiation.unitvalues[to[0]] / radiation.prefixvalues[to[1]]);
		results.unit = radiation.unitkey(to);

		return radiation.calcsignificantdigits(results, untruncated);
	},

	// Math conversions for the logarithmic slider.
	logscale: function(logscale, unit) {
		var level = radiation.convert(logscale, unit, 'microsievert').level;
		if (level > 10000000) {
			return 7;
		} else if (level < 1) {
			return 0;
		}

		return Math.log(level)/Math.LN10;
	},
	
	logscalerange: function(logscale, min, max) {
		return Math.floor(logscale/7*(max-min)+min);
	},
	
	linearscale: function(linearscale, unit) {
		var level = Math.pow(10,linearscale);
		return radiation.convert(level, 'microsievert', unit);
	},

	linearscalerange: function(linearscale, min, max) {
		return 7*linearscale/((max-min)+min);
	},
	
	// Identify the severity of the radiation on a scale of 1-100 (mapped to logartihmic values)
	severity: function(level, unit) {
		// level = currently specified value, could contain commas.
		// unit = [unit coefficient lookup, prefix coefficient lookup]

		if (typeof level == 'string') {
			level = level.replace(',', '');			
		}

		var logscale = radiation.logscale(level, unit);
		var sevvalue = radiation.logscalerange(logscale, 1, 100);

		return sevvalue;
	},

	getexposuremultiplier: function(from, to) {
		var fromindex = radiation.rateslookup[from];
		var toindex = radiation.rateslookup[to];
		var multiplier = 1;

		if (fromindex == toindex) { return multiplier; }
		
		var direction = fromindex < toindex ? 1 : -1;		
		
		for (var i = fromindex; i != toindex; i += direction) {
			if (direction > 0) {
				multiplier *= radiation.ratevalues[i+direction];
			} else {
				multiplier /= radiation.ratevalues[i];
			}
		}
		
		return multiplier;
	},
	
	quickstring: function(jsonobj, targetunit) {
		var value = radiation.convert(jsonobj.level,jsonobj.unit,targetunit, true);
		var description = jsonobj.description;
		description = description.substr(0, description.length-1);
		description = description[0].toLowerCase() + description.substr(1);
		return description + ' ('+value.level + ' ' + value.unit + ')';
	},
	
	quickratio: function(level1, level2, lessthan) {
		// always  express in terms of positive.
		var high = Math.max(level1, level2);
		var low = Math.min(level1, level2);

		var ratio = Math.floor(high/low);
		
		console.log(ratio);
		
		if (ratio > 1 && ratio <= 10) {
			return lessthan ? ratio + 'x' : '1/'+ratio;
		} else {
			return lessthan ? '>' : '<';
		}
	},

	comparison: function(level, unit, category) {
		var datasource = radiation[category];
		var value = radiation.convert(level, unit, 'millisievert', true);

		// Variables to store the JSON for the correct levels.
		var higher, equal, lower;

		for (var i = 0; i < radiation[category].length; i++) {
			if (value.level < radiation[category][i].level) {
				higher = radiation[category][i];
			} else if (value.level == radiation[category][i].level) {
				equal = radiation[category][i];
			} else if (value.level > radiation[category][i].level) {
				lower = radiation[category][i];
				break;
			} else {
				// Never gets here.
			}
		}
		
		var results = {'higher':{},'equal':{},'lower':{}};
		
		if (higher) {
			results['higher'].factor = radiation.quickratio(higher.level, value.level);
			results['higher'].description = higher.description;
		}
		if (equal) {
			results['equal'].factor = '=';
			results['equal'].description = equal.description;
		}
		if (lower) {
			results['lower'].factor = radiation.quickratio(lower.level, value.level, true);
			results['lower'].description = lower.description;
		}
		
		console.log(results);

		var strings = [];
		
		if (equal) {
			if (equal.type == 'reference') {
				strings.push('Exposure at this level is approximately equivalent to ' + radiation.quickstring(equal, unit)+'.');
			}
			if (equal.type == 'result') {
				strings.push('Exposure at approximately this level ' + radiation.quickstring(equal, unit)+'.');
			}
			if (equal.type == 'limit') {
				strings.push('Exposure at approximately this level is right at ' + radiation.quickstring(equal, unit)+'.');
			}
		} 
		if (lower && higher && !equal) {
			if (lower.type =='reference' && higher.type  == 'reference') {
				strings.push('Exposure at this level is higher than ' + radiation.quickstring(lower,unit) + ' but less than ' + radiation.quickstring(higher,unit)+'.');
			}
			if (lower.type =='reference' && higher.type  == 'result') {
				strings.push('Exposure at this level is higher than ' + radiation.quickstring(lower,unit) + ' but less than that which ' + radiation.quickstring(higher,unit)+'.');
			}
			if (lower.type =='result' && higher.type  == 'result') {
				strings.push('Exposure at this level is higher than that which ' + radiation.quickstring(lower,unit) + ' but less than that which ' + radiation.quickstring(higher,unit)+'.');
			}
			if (lower.type =='limit' && higher.type  == 'limit') {
				strings.push('Exposure at this level is below the ' + radiation.quickstring(higher,unit) + ' but higher than ' + radiation.quickstring(lower,unit)+'.');
			}
		}
		if (lower && !equal) {
			var ratio = radiation.quickratio(value.level, lower.level);
			if (ratio > 1 && ratio <= 10) {
				if (lower.type == 'reference') {
					strings.push('Exposure at this level is approximately '+ratio+' times higher than ' + radiation.quickstring(lower, unit)+'.');
				}
				if (lower.type == 'result') {
					strings.push('Exposure at this level is approximately '+ratio+' times higher than that which ' + radiation.quickstring(lower, unit)+'.');
				}
				if (lower.type == 'limit') {
					strings.push('Exposure at this level is approximately '+ratio+' times higher than the ' + radiation.quickstring(lower, unit)+'.');
				}
			} else {
				if (lower.type == 'reference') {
					strings.push('Exposure at this level is higher than ' + radiation.quickstring(lower, unit)+'.');
				}
				if (lower.type == 'result') {
					strings.push('Exposure at this level is higher than that which ' + radiation.quickstring(lower, unit)+'.');
				}
				if (lower.type == 'limit') {
					strings.push('Exposure at this level is higher than the ' + radiation.quickstring(lower, unit)+'.');
				}				
			}
		}
		if (higher && !equal) {
			var ratio = radiation.quickratio(value.level, higher.level);
			if (ratio > 1 && ratio <= 10) {
				if (higher.type == 'reference') {
					strings.push('Exposure at this level is approximately '+ratio+' times less than ' + radiation.quickstring(higher, unit)+'.');
				}
				if (higher.type == 'result') {
					strings.push('Exposure at this level is approximately '+ratio+' times less than that which ' + radiation.quickstring(higher, unit)+'.');
				}				
				if (higher.type == 'limit') {
					strings.push('Exposure at this level is approximately '+ratio+' times less than the ' + radiation.quickstring(higher, unit)+'.');
				}				
			} else {
				if (higher.type == 'reference') {
					strings.push('Exposure at this level is less than ' + radiation.quickstring(higher, unit)+'.');
				}
				if (higher.type == 'result') {
					strings.push('Exposure at this level is less than that which ' + radiation.quickstring(higher, unit)+'.');
				}				
				if (higher.type == 'limit') {
					strings.push('Exposure at this level is less than the ' + radiation.quickstring(higher, unit)+'.');
				}				
			}
		}

		return strings;		
	},

	/* For inline replacement. */

	textnodes: [],

	// regex for finding instances.
	buildregex: function() {
		radiation.regex = new RegExp("([\\d\\,\\.]+)[\\-\\s]*("+radiation.unitstrings.join('|')+")\\b", 'gim');
	},
	
	findonpage: function(element) {
		// Disallow most node types.
		if (element.nodeType != 3 && (element.nodeType != 1 || element.nodeName == 'script' || element.className.indexOf('exclude') != -1)) { return; }

	    if (element.nodeType == 3 && radiation.regex.test(element.nodeValue)) {
			radiation.textnodes.push(element);
	    } else {
			// Recurse.
			var length = element.childNodes.length;
	        for (var i = 0; i < length; i++) {
	            radiation.findonpage(element.childNodes[i]);
	        }
	    }
	},
	
	processfinds: function() {
		if (!radiation.textnodes.length) { return; }

		var docfrag;
		var string;
		var tempwrapper = document.createElement('span');
		for (var i = 0; i < radiation.textnodes.length; i++) {
			string = radiation.textnodes[i].nodeValue;
			string = string.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
			string = string.replace(radiation.regex,radiation.replacementcontent);
			
			tempwrapper.innerHTML = string;
			docfrag = document.createDocumentFragment();

			while (tempwrapper.firstChild) {
				docfrag.appendChild(tempwrapper.firstChild);
			}
			radiation.textnodes[i].parentNode.insertBefore(docfrag, radiation.textnodes[i]);
			radiation.textnodes[i].parentNode.removeChild(radiation.textnodes[i]);
		}

		var rollover = document.createElement('div');
		rollover.className = 'radiationinfo-rollover';
		rollover.style.display = 'none';
		rollover.innerHTML = radiation.rollovercontent();
		document.body.appendChild(rollover);
		
		// Embed
		radiation.$('.radiationinfo-unit').live('mouseenter', function(event) {
			var offset = radiation.$(this).offset();
			var width = radiation.$(this).width();
			var height = radiation.$('.radiationinfo-rollover').height();
			var position  = { display: 'block', top: offset.top-height-30+'px', left: event.pageX-91+'px' };
			radiation.$('.radiationinfo-rollover').css(position);
		});
		radiation.$('.radiationinfo-unit').live('mouseleave', function() {
			radiation.$('.radiationinfo-rollover').css({left:'-999em', top: 0 });
		});
	},
	
	replacementcontent: function (match, level, unit, index, textnodevalue) {
		return '<span class="radiationinfo-unit radiationinfo-sev'+radiation.severity(level, unit)+'">'+match+'</span>';
	},
	
	rollovercontent: function() {
		return '<h1 class="radiationinfo-rate">1 microsievert</h1><dl class="radiationinfo-risk"><dt>Short term risk:</dt><dd class="sev1">None<br /></dd><dt>Long term risk:</dt><dd class="sev1">None</dd></dl><p class="radiationinfo-details">This is about the equivalent of eating ten bananas and is harmless.</p>';
	},
	
	load$: function() {
	    var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true;
	    s.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js';
	    var o = document.getElementsByTagName('script')[0]; o.parentNode.insertBefore(s, o);
	},
	
	checkload$: function(first) {
		if (typeof jQuery != 'undefined') {
			if (first) {
				radiation.$ = jQuery;
			} else {
				radiation.$ = jQuery.noConflict(true);
			}
			radiation.$(function() {
				$('head').append('<link rel="stylesheet" type="text/css" href="{{CDN}}_css/radiation.css" />');
				document.body.normalize();
				radiation.findonpage(document.body);
				radiation.processfinds();				
			});
		} else {
			if (first) { radiation.load$(); }
			setTimeout(radiation.checkload$,200);
		}
	}

};

// Build radiation.reverselookup and radiation.unitstrings array.
radiation.generatelookups();

// Generate the regex for matching.
radiation.buildregex();

// When ready, process the document.
radiation.checkload$(true);