moduleAid.VERSION = '1.1.3';
moduleAid.VARSLIST = ['toggleMiddleClick', 'toggleAnimated', 'toggleEngineFocus', 'toggleURLBarHandlers'];

// Toggle middle click functionality
this.toggleMiddleClick = function() {
	moduleAid.loadIf("middleClick", prefAid.middleClick);
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
this.toggleURLBarHandlers = function() {
	if(window.gURLBar.popup == $('PopupAutoComplete')) { return; }
	
	if(!prefAid.autoSelect && !prefAid.organizePopup) {
		moduleAid.unload("autoSelect");
		moduleAid.unload("organize");
		moduleAid.unload("urlbarHandlers");
	} else {
		moduleAid.load("urlbarHandlers");
		moduleAid.loadIf("autoSelect", prefAid.autoSelect);
		moduleAid.loadIf("organize", prefAid.organizePopup);
	}
};
	
moduleAid.LOADMODULE = function() {
	prefAid.listen('middleClick', toggleMiddleClick);
	prefAid.listen('organizePopup', toggleURLBarHandlers);
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('engineFocus', toggleEngineFocus);
	prefAid.listen('autoSelect', toggleURLBarHandlers);
	
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
	
	moduleAid.unload("middleClick");
	moduleAid.unload("animated");
	moduleAid.unload("engineFocus");
	moduleAid.unload("autoSelect");
	moduleAid.unload("organize");
	moduleAid.unload("urlbarHandlers");
};
