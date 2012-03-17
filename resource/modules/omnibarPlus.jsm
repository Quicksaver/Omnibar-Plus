moduleAid.VERSION = '1.1.0';
moduleAid.VARSLIST = ['toggleMiddleClick', 'toggleOrganize', 'toggleF6', 'toggleAnimated', 'toggleEngineFocus'];

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("middleClick", prefAid.middleClick);
};

// Toggle organize functionality
this.toggleOrganize = function() {
	// We don't organize the simple autocomplete
	moduleAid.loadIf("organize", (prefAid.organizePopup && window.gURLBar.popup != document.getElementById('PopupAutoComplete')));
};

// Toggle F6 functionality
this.toggleF6 = function() {
	moduleAid.loadIf("F6", prefAid.f6);
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
	prefAid.listen('f6', toggleF6);
	prefAid.listen('middleClick', toggleMiddleClick);
	prefAid.listen('organizePopup', toggleOrganize);
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('engineFocus', toggleEngineFocus);
	
	toggleF6();
	toggleMiddleClick();
	toggleOrganize();
	toggleAnimated();
	toggleEngineFocus();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('f6', toggleF6);
	prefAid.unlisten('middleClick', toggleMiddleClick);
	prefAid.unlisten('organizePopup', toggleOrganize);
	prefAid.unlisten('animated', toggleAnimated);
	prefAid.unlisten('engineFocus', toggleEngineFocus);
	
	moduleAid.unload("middleClick");
	moduleAid.unload("organize");
	moduleAid.unload("F6");
	moduleAid.unload("animated");
	moduleAid.unload("engineFocus");
};
