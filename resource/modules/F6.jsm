moduleAid.VERSION = '1.1.0';
moduleAid.VARSLIST = ['focusBar'];

// function to use for our F6 command
this.focusBar = function() {
	if(!window.gURLBar.focused) {
		window.openLocation();
	}
	else if(window.gBrowser) {
		window.gBrowser.mCurrentBrowser.focus();
	}
};

moduleAid.LOADMODULE = function() {
	overlayAid.overlayURI("chrome://browser/content/browser.xul", "F6");
};

moduleAid.UNLOADMODULE = function() {
	overlayAid.unOverlayURI("chrome://browser/content/browser.xul", "F6");
};
