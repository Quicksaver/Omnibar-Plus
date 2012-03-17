moduleAid.VERSION = '1.0.2';
moduleAid.VARSLIST = ['gURLBar', 'usingRichlist', 'toggleScheme'];

this.__defineGetter__('gURLBar', function() { return window.gURLBar; });

this.usingRichlist = (gURLBar.popup == document.getElementById('PopupAutoComplete')) ? false : true;

this.toggleScheme = function() {
	gURLBar.popup.setAttribute('animatedPopup', prefAid.animatedScheme);
	styleAid.load('animatedScheme', prefAid.animatedScheme);
};

moduleAid.LOADMODULE = function() {
	prefAid.listen('animatedScheme', toggleScheme);
	
	toggleScheme();
	styleAid.load('animatedPopup', 'autocompletepopup');
	
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

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('animatedScheme', toggleScheme);
	
	gURLBar.popup.removeAttribute('animatedPopup');
	styleAid.unload('animatedPopup');
	styleAid.unload('animatedScheme');
	
	if(!usingRichlist) {
		gURLBar.popup.adjustHeight = gURLBar.popup._adjustHeight;
		delete gURLBar.popup._adjustHeight;
	}
};
