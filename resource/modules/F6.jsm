moduleAid.VERSION = '1.2.0';
moduleAid.VARSLIST = [];

moduleAid.LOADMODULE = function() {
	overlayAid.overlayURI("chrome://browser/content/browser.xul", "F6");
};

moduleAid.UNLOADMODULE = function() {
	overlayAid.unOverlayURI("chrome://browser/content/browser.xul", "F6");
};
