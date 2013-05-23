moduleAid.VERSION = '1.1.6';

this.__defineGetter__('gURLBar', function() { return window.gURLBar; });

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("middleClick", prefAid.omnibar && prefAid.middleClick);
};

// Toggle animated effects for the suggestion list
this.toggleAnimated = function() {
	moduleAid.loadIf("animated", prefAid.animated);
};

// Toggles wether to focus the location bar when changing the search engine
this.toggleEngineFocus = function() {
	moduleAid.loadIf("engineFocus", prefAid.omnibar && prefAid.engineFocus);
};

// Toggles autoSelect feature
this.toggleURLBarHandlers = function() {
	moduleAid.loadIf("urlbarHandlers", prefAid.omnibar && gURLBar.popup == $('PopupAutoCompleteRichResult') && (prefAid.autoSelect || prefAid.organizePopup));
};
	
moduleAid.LOADMODULE = function() {
	prefAid.setDefaults({ popupstyle: "RICHSLIM" }, 'omnibar');
	
	prefAid.listen('middleClick', toggleMiddleClick);
	prefAid.listen('organizePopup', toggleURLBarHandlers);
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('engineFocus', toggleEngineFocus);
	prefAid.listen('autoSelect', toggleURLBarHandlers);
	prefAid.listen('popupstyle', toggleURLBarHandlers);
	
	toggleMiddleClick();
	toggleAnimated();
	toggleEngineFocus();
	toggleURLBarHandlers();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('middleClick', toggleMiddleClick);
	prefAid.unlisten('organizePopup', toggleURLBarHandlers);
	prefAid.unlisten('animated', toggleAnimated);
	prefAid.unlisten('engineFocus', toggleEngineFocus);
	prefAid.unlisten('autoSelect', toggleURLBarHandlers);
	prefAid.unlisten('popupstyle', toggleURLBarHandlers);
	
	moduleAid.unload("urlbarHandlers");
	moduleAid.unload("engineFocus");
	moduleAid.unload("animated");
	moduleAid.unload("middleClick");
};
