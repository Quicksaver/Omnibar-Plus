this.VERSION = '1.0.5';
this.VARSLIST = ['toggleMiddleClick', 'toggleOrganize', 'toggleF6', 'toggleAnimated', 'toggleEngineFocus'];

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("resource://"+objPathString+"/modules/middleClick.jsm", prefAid.middleClick);
};

// Toggle organize functionality
this.toggleOrganize = function() {
	// We don't organize the simple autocomplete
	moduleAid.loadIf("resource://"+objPathString+"/modules/organize.jsm", (prefAid.organizePopup && gURLBar.popup != document.getElementById('PopupAutoComplete')));
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

this.LOADMODULE = function() {
	prefAid.setDefaults({
		f6: true,
		middleClick: true,
		organizePopup: true,
		animated: false,
		engineFocus: true,
		animatedScheme: 'sky',
		agrenon: false,
		smarterwiki: false,
		organize1: 'EE',
		organize2: 'agrenon',
		organize3: 'smarterwiki',
		organize4: 'omnibar',
		autoSelect: 'true'
	});
	prefAid.ready(['f6', 'middleClick', 'organizePopup', 'animated', 'engineFocus']);
	
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
