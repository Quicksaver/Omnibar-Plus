moduleAid.VERSION = '1.1.0';

this.__defineGetter__('Omnibar', function() { return window.Omnibar; });
this.__defineGetter__('gBrowser', function() { return window.gBrowser; });

this.__defineGetter__('goButton', function() { return $('go-button'); });
this.__defineGetter__('panel', function() { return $('PopupAutoCompleteRichResult'); });
this.__defineGetter__('richlistbox', function() { return panel.richlistbox; });
this.__defineGetter__('richlist', function() { return richlistbox.childNodes; });

this.unSelectHandlers = [];
this.keyHandlers = [];
this.addHandler = function(master, handler, weight) {
	master.push({ handler: handler, weight: weight });
	// Handler with the highest weight go first
	master.sort(function(a,b) { return b.weight-a.weight; });
};
this.removeHandler = function(master, handler, weight) {
	for(var h=0; h<master.length; h++) {
		if(master[h].handler == handler && master[h].weight == weight) {
			master.splice(h, 1);
			return;
		}
	}
};

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
	dispatch(gURLBar, { type: 'obpSearchBegin', cancelable: false });
};

this.searchComplete = function() {
	dispatch(gURLBar, { type: 'obpSearchComplete', cancelable: false });
};

this.onKeyPress = function(e) {
	// Compatibility with the UI Enhancer add-on
	// don't handle keystrokes on it's editing box
	if(isAncestor(document.commandDispatcher.focusedElement, $('UIEnhancer_URLBar_Editing_Stack_Text'))) { return gURLBar._onKeyPress(e); }
	
	// Just discriminating using the same criteria the original onKeyPress does
	if (e.target.localName != "textbox") { return false; }
	
	// I had this set in a handler function to always be set on keystroke, I don't remember if there was a reason for it (like being unset for some reason) so
	// I'm leaving it like this for now
	setGo();
	
	if(keyHandlers.length > 0) {
		return keyHandlers[0].handler(e);
	}
	return gURLBar._onKeyPress(e);
};

// Set the go button to work with our handler
this.setGo = function() {
	if(goButton.getAttribute('onclick').indexOf(objName) < 0) {
		goButton._onclick = goButton.getAttribute('onclick');
		setAttribute(goButton, 'onclick', objName+'.onGo(event);');
	}
};

this.onGo = function(e) {
	// This comes from TMP_goButtonClick() (from Tab Mix Plus), the original onclick is simply gURLBar.handleCommand()
	if(goButton._onclick.indexOf('TMP') > -1 && aEvent.button == 1 && gURLBar.value == gBrowser.currentURI.spec) {
		gBrowser.duplicateTab(gBrowser.mCurrentTab);
	}
	else if(aEvent.button != 2) {
		if(prefAid.organizePopup) {
			return onGoClick(e);
		}
		if(prefAid.autoSelect) {
			unSelect();
		}
		return Omnibar._handleURLBarCommand(e);
	}
	return false;
};

this.unSelect = function() {
	if(unSelectHandlers.length > 0) {
		unSelectHandlers[0].handler();
	}
};

this.toggleAutoSelect = function() {
	moduleAid.loadIf("autoSelect", prefAid.autoSelect);
};

this.toggleOrganize = function() {
	moduleAid.loadIf("organize", prefAid.organizePopup);
};

moduleAid.LOADMODULE = function() {
	// Not sure in which version of Firefox were these implemented, maybe 14?
	if(typeof(gURLBar._searchBeginHandler) != 'undefined') {
		gURLBar._searchBeginHandler = searchBegin;
		gURLBar._searchCompleteHandler = searchComplete;
	} else {
		setAttribute(gURLBar, 'onsearchbegin', objName+".searchBegin();");
		setAttribute(gURLBar, 'onsearchcomplete', objName+".searchComplete();");
	}
	
	gURLBar._onKeyPress = gURLBar.onKeyPress;
	gURLBar.onKeyPress = onKeyPress;
	
	setGo();
	
	// It will keep the selection if we close the popup by means other than hitting a key, so we unSelect it if there's potential to follow through with previous input
	listenerAid.add(gURLBar, 'focus', unSelect, true);
	listenerAid.add(gURLBar, 'click', unSelect, true);
	
	prefAid.listen('autoSelect', toggleAutoSelect);
	prefAid.listen('organizePopup', toggleOrganize);
	
	toggleAutoSelect();
	toggleOrganize();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('autoSelect', toggleAutoSelect);
	prefAid.unlisten('organizePopup', toggleOrganize);
	
	moduleAid.unload("organize");
	moduleAid.unload("autoSelect");
	
	gURLBar.onKeyPress = gURLBar._onKeyPress;
	delete gURLBar._onKeyPress;
	
	if(typeof(gURLBar._searchBeginHandler) != 'undefined') {
		gURLBar._searchBeginHandler = null;
		gURLBar._searchCompleteHandler = null;
	} else {
		gURLBar.removeAttribute('onsearchbegin');
		gURLBar.removeAttribute('onsearchcomplete');
	}
	
	// Changed in checkOnHandlers()
	if(goButton._onclick) {
		setAttribute(goButton, 'onclick', goButton._onclick);
		delete goButton._onclick;
	}
	
	listenerAid.remove(gURLBar, 'focus', unSelect, true);
	listenerAid.remove(gURLBar, 'click', unSelect, true);
};
