// This requires the utils module
moduleAid.load("chrome://"+objPathString+"/content/utils.jsm");

var init = function() {
	if(typeof(Omnibar) == 'undefined') { return; }
	
	prefAid.init(objPathString, ['f6', 'middleClick', 'organizePopup', 'animated', 'animatedScheme', 'engineFocus', 'agrenon', 'smarterwiki', 'organize1', 'organize2', 'organize3', 'organize4', 'autoSelect']);
	prefAid.init('omnibar', ['popupstyle']);
	
	this.panel = document.getElementById('PopupAutoCompleteRichResult');
	
	// this actually helps
	gURLBar[objName] = this;
	
	prefAid.listen('f6', function() { toggleF6(); });
	prefAid.listen('middleClick', function() { toggleMiddleClick(); });
	prefAid.listen('organizePopup', function() { toggleOrganize(); });
	prefAid.listen('animated', toggleAnimated);
	prefAid.listen('animatedScheme', toggleAnimated);
	prefAid.listen('engineFocus', function() { toggleEngineFocus(); });
	prefAid.listen('popupstyle', toggleAnimated);
	
	toggleF6();
	toggleMiddleClick();		
	toggleOrganize();
	toggleAnimated();
	toggleEngineFocus();
	
	listenerAid.add(window, "unload", deinit, false, true);
	
	initialized = true;
};

var deinit = function() {
	listenerAid.clean();
};

// Toggle middle click functionality
var toggleMiddleClick = function() {
	if(prefAid.middleClick) {
		moduleAid.load("chrome://"+objPathString+"/content/middleClick.jsm");
	}
};

// Toggle organize functionality
var toggleOrganize = function() {
	if(prefAid.organizePopup) {
		moduleAid.load("chrome://"+objPathString+"/content/organize.jsm");
	}
};

// Toggle F6 functionality
var toggleF6 = function() {
	if(prefAid.f6) {
		moduleAid.load("chrome://"+objPathString+"/content/F6.jsm");
	}
};

// Toggle animated effects for the suggestion list
var toggleAnimated = function() {
	if(prefAid.animated) {
		panel.setAttribute('animatedPopup', prefAid.animatedScheme);
	} else {
		panel.removeAttribute('animatedPopup');
	}
};

// Toggles wether to focus the location bar when changing the search engine
var toggleEngineFocus = function() {
	if(prefAid.engineFocus) {
		moduleAid.load("chrome://"+objPathString+"/content/engineFocus.jsm");
	}
};

timerAid.init('preinit', init, 500);
