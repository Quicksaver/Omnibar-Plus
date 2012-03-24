moduleAid.VERSION = '1.1.1';
moduleAid.VARSLIST = ['toggleMiddleClick', 'toggleOrganize', 'toggleAnimated', 'toggleEngineFocus'];

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("middleClick", prefAid.middleClick);
};

// Toggle organize functionality
this.toggleOrganize = function() {
	// We don't organize the simple autocomplete
	moduleAid.loadIf("organize", (prefAid.organizePopup && window.gURLBar.popup != document.getElementById('PopupAutoComplete')));
};

// Toggle animated effects for the suggestion list
this.toggleAnimated = function() {
	moduleAid.loadIf("animated", prefAid.animated);
};

// Toggles wether to focus the location bar when changing the search engine
this.toggleEngineFocus = function() {
	moduleAid.loadIf("engineFocus", prefAid.engineFocus);
};
	
moduleAid.LOADMODULE = function() {
	prefAid.listen('middleClick', toggleMiddleClick);
	prefAid.listen('organizePopup', toggleOrganize);
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('engineFocus', toggleEngineFocus);
	
	toggleMiddleClick();
	toggleOrganize();
	toggleAnimated();
	toggleEngineFocus();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('middleClick', toggleMiddleClick);
	prefAid.unlisten('organizePopup', toggleOrganize);
	prefAid.unlisten('animated', toggleAnimated);
	prefAid.unlisten('engineFocus', toggleEngineFocus);
	
	moduleAid.unload("middleClick");
	moduleAid.unload("organize");
	moduleAid.unload("animated");
	moduleAid.unload("engineFocus");
};
