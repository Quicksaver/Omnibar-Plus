var init = function() {
	if(typeof(Omnibar) == 'undefined') { return; }
	
	prefAid.init(objPathString, ['f6', 'middleClick', 'organizePopup', 'animated', 'animatedScheme', 'engineFocus', 'agrenon', 'smarterwiki', 'organize1', 'organize2', 'organize3', 'organize4', 'autoSelect']);
	
	// this actually helps
	gURLBar[objName] = this;
	
	prefAid.listen('f6', function() { toggleF6(); });
	prefAid.listen('middleClick', function() { toggleMiddleClick(); });
	prefAid.listen('organizePopup', function() { toggleOrganize(); });
	prefAid.listen('animated', function() { toggleAnimated(); });
	prefAid.listen('engineFocus', function() { toggleEngineFocus(); });
	
	toggleF6();
	toggleMiddleClick();		
	toggleOrganize();
	toggleAnimated();
	toggleEngineFocus();
	
	initialized = true;
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
		moduleAid.load("chrome://"+objPathString+"/content/animated.jsm");
	}
};

// Toggles wether to focus the location bar when changing the search engine
var toggleEngineFocus = function() {
	if(prefAid.engineFocus) {
		moduleAid.load("chrome://"+objPathString+"/content/engineFocus.jsm");
	}
};

timerAid.init('preinit', init, 500);
