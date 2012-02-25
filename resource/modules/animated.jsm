this.VERSION = '1.0.0';
this.VARSLIST = ['usingRichlist', 'toggleScheme'];

this.usingRichlist = (gURLBar.popup == document.getElementById('PopupAutoComplete')) ? false : true;

this.toggleScheme = function() {
	gURLBar.popup.setAttribute('animatedPopup', prefAid.animatedScheme);
	styleAid.unload('animatedScheme');
	styleAid.load('animatedScheme', 'chrome://'+objPathString+'/skin/'+prefAid.animatedScheme+'.css');
};

this.LOADMODULE = function() {
	prefAid.init('animatedScheme');
	prefAid.listen('animatedScheme', toggleScheme);
	
	toggleScheme();
	styleAid.load('animatedPopup', 'chrome://'+objPathString+'/skin/autocompletepopup.css');
	
	if(!usingRichlist) {
		gURLBar.popup._adjustHeight = gURLBar.popup.adjustHeight;
		gURLBar.popup.adjustHeight = modifyFunction(gURLBar.popup._adjustHeight, [
			['var rows = this.maxRows;',
			<![CDATA[
			var rows = Math.round(this.maxRows * 2.5);
			]]>
			]
		]);
	}
};

this.UNLOADMODULE = function() {
	prefAid.unlisten('animatedScheme', toggleScheme);
	
	gURLBar.popup.removeAttribute('animatedPopup');
	styleAid.unload('animatedPopup');
	styleAid.unload('animatedScheme');
	
	if(!usingRichlist) {
		gURLBar.popup.adjustHeight = gURLBar.popup._adjustHeight;
		delete gURLBar.popup._adjustHeight;
	}
};
