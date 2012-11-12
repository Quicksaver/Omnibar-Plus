moduleAid.VERSION = '1.2.1';

moduleAid.LOADMODULE = function() {
	overlayAid.overlayURI("chrome://browser/content/browser.xul", "F6");
};

moduleAid.UNLOADMODULE = function() {
	overlayAid.removeOverlayURI("chrome://browser/content/browser.xul", "F6");
};
