moduleAid.VERSION = '1.0.2';
moduleAid.VARSLIST = ['gURLBar', 'panel', 'richlistbox', 'richlist', 'panelState', 'anyItem', 'searchBegin', 'searchComplete', 'onKeyPress'];

this.__defineGetter__('gURLBar', function() { return window.gURLBar; });
this.panel = $('PopupAutoCompleteRichResult');
this.richlistbox = panel.richlistbox;
this.richlist = richlistbox.childNodes;

// helper objects to get current popup status and set it
this.__defineGetter__('panelState', function() {
	// For some reason, just mPopupOpen and popupOpen aren't reliable in every case
	return (!panel.mPopupOpen && panel.state != "open") ? false : true;
});
this.__defineSetter__('panelState', function(val) {
	if(val) {
		panel._openAutocompletePopup(gURLBar, gURLBar);
		aSync(function() {
			if(!panel.mPopupOpen) { panel.mPopupOpen = true; }
			if(!panel.popupOpen) { panel.popupOpen = true; }
			if(panel.state != 'open') { panel.state = 'open'; }
		});
	} else {
		panel.closePopup();
		aSync(function() {
			// This one is called on disable so I have to prevent a warning about panel not existing anymore
			if(typeof(panel) == 'undefined') { return; }
			
			if(panel.mPopupOpen) { panel.mPopupOpen = false; }
			if(panel.popupOpen) { panel.popupOpen = false; }
			if(panel.state != 'closed') { panel.state = 'closed'; }
		});
	}
});

// Goes through currentIndex, selectedIndex and _actualIndex and returns the item associated with it, or null
this.__defineGetter__('anyItem', function() {
	if(richlistbox.currentItem) {
		return richlistbox.currentItem;
	}
	else if(richlistbox.selectedItem) {
		return richlistbox.selectedItem;
	}
	else if(richlistbox._actualItem) {
		return richlistbox._actualItem;
	}
	return null;
});

this.searchBegin = function() {
	if(prefAid.autoSelect) {
		delaySelect();
	}
};

this.searchComplete = function() {
	if(prefAid.organizePopup) {
		delayOrganize();
	}
	if(prefAid.autoSelect) {
		if(cancelSelect()) {
			autoSelect();
		}
	}
};

this.onKeyPress = function(e) {
	// Compatibility with the UI Enhancer add-on
	// don't handle keystrokes on it's editing box
	if(isAncestor(document.commandDispatcher.focusedElement, $('UIEnhancer_URLBar_Editing_Stack_Text'))) { return gURLBar._onKeyPress(e); }
	
	// Just discriminating using the same criteria the original onKeyPress does
	if (e.target.localName != "textbox") { return false; }
	
	if(prefAid.organizePopup) { return urlBarKeyDown(e); }
	if(prefAid.autoSelect) { return keySelect(e); }
	return gURLBar._onKeyPress(e);
};

moduleAid.LOADMODULE = function() {
	// Not sure in which version of Firefox were these implemented, maybe 14?
	if(typeof(gURLBar._searchBeginHandler) != 'undefined') {
		gURLBar._searchBeginHandler = searchBegin;
		gURLBar._searchCompleteHandler = searchComplete;
	} else {
		gURLBar.setAttribute('onsearchbegin', objName+".searchBegin();");
		gURLBar.setAttribute('onsearchcomplete', objName+".searchComplete();");
	}
	
	gURLBar._onKeyPress = gURLBar.onKeyPress;
	gURLBar.onKeyPress = onKeyPress;
};

moduleAid.UNLOADMODULE = function() {
	gURLBar.onKeyPress = gURLBar._onKeyPress;
	delete gURLBar._onKeyPress;
	
	if(typeof(gURLBar._searchBeginHandler) != 'undefined') {
		gURLBar._searchBeginHandler = null;
		gURLBar._searchCompleteHandler = null;
	} else {
		gURLBar.removeAttribute('onsearchbegin');
		gURLBar.removeAttribute('onsearchcomplete');
	}
};
