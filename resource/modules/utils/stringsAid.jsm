moduleAid.VERSION = '2.1.0';
moduleAid.LAZY = true;

// stringsAid - use for getting strings out of bundles from .properties locale files
// get(bundle, string, replace, aNumber) - returns the desired string
//	bundle - (string) name of the bundle to retrieve the string from, just aBundle in chrome://objPathString/locale/aBundle.properties
//	string - (string) name of the string to retrieve from bundle
//	(optional) replace - (array) [ [original, new] x n ] retrieves the string with the occurences of original replaced with new
//	(optional) aNumber - 	(int) if set will choose the corresponding Plural Form from the string returned based on it;
//				expects string "PluralRule" defined in the same bundle representing a number.
//				See https://developer.mozilla.org/en-US/docs/Localization_and_Plurals
//	(dont set) alt - don't set this variable, it is for internal use so the method know it needs to look in a special location for en locales, like in the case of
//			 untranslated strings, this should be set in chrome.manifest as objPathString-en to the en-US locale.
this.stringsAid = {
	bundles: {},
	
	getPath: function(aPath, alt) {
		return "chrome://"+objPathString+((alt) ? '-en' : '')+"/locale/"+aPath+".properties";
	},
	
	get: function(bundle, string, replace, aNumber, alt) {
		var bundleObj = bundle;
		if(alt) { bundleObj += '-en'; }
		
		if(!this.bundles[bundleObj]) {
			this.bundles[bundleObj] = Services.strings.createBundle(this.getPath(bundle, alt));
		}
		
		try { string = this.bundles[bundleObj].GetStringFromName(string); }
		catch(ex) {
			if(!alt) {
				var myex = 'Failed to load string from properties file. [Addon: '+objPathString+'] [File: '+bundle+'] [String: '+string+']';
				try {
					string = this.get(bundle, string, replace, aNumber, true);
					if(string !== null) {
						Services.console.logStringMessage(myex + ' [Successfully loaded en backup]');
					} else {
						Cu.reportError(myex + ' [Failed to load en backup]');
						string = '';
					}
					return string;
				}
				catch(exx) {
					Cu.reportError(myex + ' [Failed to load en backup]');
					return '';
				}
			}
			else { return null; }
		}
		
		// This means we are dealing with a possible Plural Form, so we need to make sure we treat it accordingly
		if(aNumber != undefined && string.indexOf(';') > -1) {
			try {
				var [getForm, numForms] = PluralForm.makeGetter(this.bundles[bundleObj].GetStringFromName('PluralRule'));
				string = getForm(aNumber, string);
			}
			catch(ex) {} // if there's no "PluralRule" defined, skip this as it might just actually be an intentional semi-colon
		}
		
		if(replace) {
			for(var i = 0; i < replace.length; i++) {
				while(string.indexOf(replace[i][0]) > -1) {
					string = string.replace(replace[i][0], replace[i][1]);
				}
			}
		}
		
		return string;
	}
};
