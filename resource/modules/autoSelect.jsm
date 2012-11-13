moduleAid.VERSION = '1.1.0';

// Helper to check whether the value input is already uri like or not
this.__defineGetter__('willHandle', function() {
	// Is the first word an alias of a search engine
	var search = trim(gURLBar.value);
	if(search.indexOf(' ') > -1 && Services.search.getEngineByAlias(search.split(' ')[0])) {
		return true;
	}
	
	var isURILike = false;
	// Is input already a URI
	try {
		if(Services.io.newURI(gURLBar.value, null, null)) {
			isURILike = true;
		}
	} catch(ex) {}
	
	if(!isURILike) {
		// Is input domain-like (e.g., site.com/page)
		try {
			if(Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService).getBaseDomainFromHost(gURLBar.value)) {
				isURILike = true;
			}
		} catch(ex) {}
	}
	
	if(isURILike && !inFirst) {
		return true;
	}
	
	return false;
});

// Checks if the content of the urlbar is part of the first entry in the suggestions list
this.__defineGetter__('inFirst', function() {
	if(richlist.length > 0 && richlist[0].getAttribute('url').indexOf(gURLBar.value) > -1) {
		return true;
	}
	return false;
});

this.selectI = function(i) {
	if(i == undefined) { i = -1; }
	
	if(prefAid.organizePopup) {
		doIndexes(i, i);
	} else {
		richlistbox.selectedIndex = i;
		richlistbox.currentIndex = i;
	}
};

this.dontSelect = false;

this.autoSelect = function() {
	if(dontSelect || richlistbox.selectedIndex > 0 || richlistbox.currentIndex > 0) { 
		cancelSelect();
		return false;
	}
	
	if(!willHandle) {
		selectI(0);
	}
	return true;
};

this.delaySelect = function() {
	if(dontSelect) { return; }
	
	if(!timerAid.autoSelect) {
		unSelect();
		if(autoSelect()) {
			timerAid.init('autoSelect', autoSelect, 200, 'slack');
		}
	}
};

this.cancelSelect = function() {
	return timerAid.cancel('autoSelect');
};

this.autoSelectOnComplete = function() {
	if(cancelSelect()) {
		autoSelect();
	}
};

this.keySelect = function(e) {
	dontSelect = false;
	
	if(!gURLBar.focused || !panelState) {
		return gURLBar._onKeyPress(e);
	}
	
	switch(e.keyCode) {
		case e.DOM_VK_PAGE_UP:
		case e.DOM_VK_PAGE_DOWN:
		case e.DOM_VK_UP:
		case e.DOM_VK_DOWN:
			// No point in doing anything if popup isn't open
			if(!panelState) {
				gURLBar.controller.startSearch(gURLBar.value);
				return false;
			}
			break;
		
		default: break;
	}
	
	switch(e.keyCode) {
		case e.DOM_VK_ESCAPE:
			dontSelect = true;
			if(panelState && richlistbox.selectedIndex > -1) {
				unSelect();
				return false;
			}
			break;
		
		case e.DOM_VK_TAB:
		case e.DOM_VK_PAGE_UP:
		case e.DOM_VK_PAGE_DOWN:
		case e.DOM_VK_UP:
		case e.DOM_VK_DOWN:
		case e.DOM_VK_LEFT:
		case e.DOM_VK_RIGHT:
		case e.DOM_VK_HOME:
		case e.DOM_VK_END:
		case e.DOM_VK_CONTEXT_MENU:
		case e.DOM_VK_ENTER:
		case e.DOM_VK_RETURN:
			dontSelect = true;
			break;
		
		case e.DOM_VK_DELETE:
			if(e.ctrlKey || gURLBar.selectionStart != gURLBar.selectionEnd || gURLBar.selectionStart != gURLBar.textLength) {
				unSelect();
			}
			break;
		
		default: break;
	}
	
	return gURLBar._onKeyPress(e);
};

this.autoSelectOnBeginKeyDown = function(e) {
	var keyE = e.detail.keyEvent;
	dontSelect = false;
	if(panelState) {
		switch(keyE.keyCode) {
			case keyE.DOM_VK_TAB:
			case keyE.DOM_VK_PAGE_UP:
			case keyE.DOM_VK_PAGE_DOWN:
			case keyE.DOM_VK_UP:
			case keyE.DOM_VK_DOWN:
			case keyE.DOM_VK_ESCAPE:
			case keyE.DOM_VK_LEFT:
			case keyE.DOM_VK_RIGHT:
			case keyE.DOM_VK_HOME:
			case keyE.DOM_VK_END:
			case keyE.DOM_VK_CONTEXT_MENU:
			case keyE.DOM_VK_ENTER:
			case keyE.DOM_VK_RETURN:
				dontSelect = true;
				break;
				
			case keyE.DOM_VK_DELETE:
				if(!(keyE.ctrlKey || gURLBar.selectionStart != gURLBar.selectionEnd || gURLBar.selectionStart != gURLBar.textLength)
				&& panelState
				&& (timerAid.delayOrganize || richlistbox.currentIndex > -1)) {
					dontSelect = true;
				}
				break;
				
			default: break;
		}
	}
};

this.autoSelectOnOrganize = {
	selectFirst: false,
	originalSelectedIndex: -1,
	originalCurrentIndex: -1
};

this.autoSelectOnBeginOrganize = function() {
	autoSelectOnOrganize = {
		selectFirst: timerAid.cancel('autoSelect'),
		originalSelectedIndex: richlistbox.selectedIndex,
		originalCurrentIndex: richlistbox.currentIndex
	};
};

this.autoSelectOnEndOrganize = function() {
	// AutoSelect if it hasn't already
	if(autoSelectOnOrganize.selectFirst || (autoSelectOnOrganize.originalSelectedIndex <= 0 && autoSelectOnOrganize.originalCurrentIndex <= 0)) {
		autoSelect();
	} else {
		if(autoSelectOnOrganize.originalSelectedIndex >= richlist.length) { autoSelectOnOrganize.originalSelectedIndex = -1; }
		if(autoSelectOnOrganize.originalCurrentIndex >= richlist.length) { autoSelectOnOrganize.originalCurrentIndex = -1; }
		
		doIndexes(autoSelectOnOrganize.originalSelectedIndex, autoSelectOnOrganize.originalCurrentIndex);
	}
};

moduleAid.LOADMODULE = function() {
	addHandler(keyHandlers, keySelect, 100);
	addHandler(unSelectHandlers, selectI, 200);
	
	listenerAid.add(gURLBar, 'obpSearchBegin', delaySelect);
	listenerAid.add(gURLBar, 'obpSearchComplete', autoSelectOnComplete);
	
	listenerAid.add(panel, 'obpBeginOrganize', autoSelectOnBeginOrganize);
	listenerAid.add(panel, 'obpEndOrganize', autoSelectOnEndOrganize);
	listenerAid.add(gURLBar, 'obpBeginKeyDown', autoSelectOnBeginKeyDown);
};

moduleAid.UNLOADMODULE = function() {
	cancelSelect();
	
	listenerAid.remove(gURLBar, 'obpSearchBegin', delaySelect);
	listenerAid.remove(gURLBar, 'obpSearchComplete', autoSelectOnComplete);
	
	listenerAid.remove(panel, 'obpBeginOrganize', autoSelectOnBeginOrganize);
	listenerAid.remove(panel, 'obpEndOrganize', autoSelectOnEndOrganize);
	listenerAid.remove(gURLBar, 'obpBeginKeyDown', autoSelectOnBeginKeyDown);
	
	removeHandler(keyHandlers, keySelect, 100);
	removeHandler(unSelectHandlers, selectI, 200);
};
