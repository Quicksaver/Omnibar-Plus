moduleAid.VERSION = '1.0.8';

this.__defineGetter__('gURLBar', function() { return window.gURLBar; });
this.usingRichlist = (gURLBar.popup == $('PopupAutoComplete')) ? false : true;

this.toggleScheme = function() {
	gURLBar.popup.setAttribute('animatedPopup', prefAid.animatedScheme);
	if(Services.appinfo.OS != 'Darwin' && Services.appinfo.OS != 'WINNT') {
		gURLBar.popup.setAttribute('linux', 'true');
	}
	loadSheets();
};

this.loadSheets = function() {
	styleAid.load('animatedScheme', prefAid.animatedScheme);
	styleAid.load('animatedPopup', 'autocompletepopup');
};

moduleAid.LOADMODULE = function() {
	prefAid.listen('animatedScheme', toggleScheme);
	
	toggleScheme();
	
	// Sometimes the sheets are unloaded for some reason
	listenerAid.add(gURLBar.popup, 'popupshowing', loadSheets, false);
	
	// Bugfix: it wouldn't apply the theme at startup when using the slim style, so we force a reload of the theme in this case
	if(!usingRichlist) {
		aSync(function() {
			if(UNLOADED) { return; }
			var actual = prefAid.animatedScheme;
			prefAid.animatedScheme = (actual == 'sky') ? 'ruby' : 'sky';
			prefAid.animatedScheme = actual;
		});
	}
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('animatedScheme', toggleScheme);
	
	gURLBar.popup.removeAttribute('animatedPopup');
	gURLBar.popup.removeAttribute('linux');
	
	listenerAid.remove(gURLBar.popup, 'popupshowing', loadSheets, false);
	
	if(UNLOADED) {
		styleAid.unload('animatedPopup');
		styleAid.unload('animatedScheme');
	}
};
