this.init = function() {
	prefAid.init(['f6', 'middleClick', 'organizePopup', 'animated', 'animatedScheme', 'engineFocus', 'agrenon', 'smarterwiki', 'organize1', 'organize2', 'organize3', 'organize4', 'autoSelect']);
	
	// this actually helps
	gURLBar[objName] = this;
	
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
	
	initialized = true;
};

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("resource://"+objPathString+"/modules/middleClick.jsm", prefAid.middleClick);
};

// Toggle organize functionality
this.toggleOrganize = function() {
	// We don't organize the simple autocomplete
	moduleAid.loadIf("resource://"+objPathString+"/modules/organize.jsm", (prefAid.organizePopup && gURLBar.popup == document.getElementById('PopupAutoComplete')));
};

// Toggle F6 functionality
this.toggleF6 = function() {
	moduleAid.loadIf("resource://"+objPathString+"/modules/F6.jsm", prefAid.f6);
};

// Toggle animated effects for the suggestion list
this.toggleAnimated = function() {
	moduleAid.loadIf("resource://"+objPathString+"/modules/animated.jsm", prefAid.animated);
};

// Toggles wether to focus the location bar when changing the search engine
this.toggleEngineFocus = function() {
	moduleAid.loadIf("resource://"+objPathString+"/modules/engineFocus.jsm", prefAid.engineFocus);
};

this.VARSLIST = ['init', 'toggleMiddleClick', 'toggleOrganize', 'toggleF6', 'toggleAnimated', 'toggleEngineFocus'];

this.LOADMODULE = function() {
	timerAid.init('preinit', init, 500);
};

this.UNLOADMODULE = function() {
	delete gURLBar[objName];
	
	prefAid.unlisten('f6', toggleF6);
	prefAid.unlisten('middleClick', toggleMiddleClick);
	prefAid.unlisten('organizePopup', toggleOrganize);
	prefAid.unlisten('animated', toggleAnimated);
	prefAid.unlisten('engineFocus', toggleEngineFocus);
	
	moduleAid.unload("resource://"+objPathString+"/modules/middleClick.jsm");
	moduleAid.unload("resource://"+objPathString+"/modules/organize.jsm");
	moduleAid.unload("resource://"+objPathString+"/modules/F6.jsm");
	moduleAid.unload("resource://"+objPathString+"/modules/animated.jsm");
	moduleAid.unload("resource://"+objPathString+"/modules/engineFocus.jsm");
};
