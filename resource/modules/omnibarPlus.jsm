moduleAid.VERSION = '1.1.2';
moduleAid.VARSLIST = ['toggleMiddleClick', 'toggleOrganize', 'toggleAnimated', 'toggleEngineFocus', 'toggleAutoSelect'];

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

// Toggles autoSelect feature
this.toggleAutoSelect = function() {
	moduleAid.loadIf("autoSelect", prefAid.autoSelect);
};
	
moduleAid.LOADMODULE = function() {
	prefAid.listen('middleClick', toggleMiddleClick);
	prefAid.listen('organizePopup', toggleOrganize);
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('engineFocus', toggleEngineFocus);
	prefAid.listen('autoSelect', toggleAutoSelect);
	
	toggleMiddleClick();
	toggleOrganize();
	toggleAnimated();
	toggleEngineFocus();
	toggleAutoSelect();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('middleClick', toggleMiddleClick);
	prefAid.unlisten('organizePopup', toggleOrganize);
	prefAid.unlisten('animated', toggleAnimated);
	prefAid.unlisten('engineFocus', toggleEngineFocus);
	prefAid.unlisten('autoSelect', toggleAutoSelect);
	
	moduleAid.unload("middleClick");
	moduleAid.unload("organize");
	moduleAid.unload("animated");
	moduleAid.unload("engineFocus");
	moduleAid.unload("autoSelect");
};
