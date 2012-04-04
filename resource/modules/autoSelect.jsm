moduleAid.VERSION = '1.0.2';
moduleAid.VARSLIST = ['willHandle', 'inFirst', 'dontSelect', 'selectI', 'autoSelect', 'delaySelect', 'cancelSelect', 'keySelect'];

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

this.dontSelect = false;

this.selectI = function(i) {
	if(prefAid.organizePopup) {
		doIndexes(i, i);
	} else {
		richlistbox.selectedIndex = i;
		richlistbox.currentIndex = i;
	}
};

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
		selectI(-1);
		if(autoSelect()) {
			timerAid.init('autoSelect', autoSelect, 200, 'slack');
		}
	}
};

this.cancelSelect = function() {
	return timerAid.cancel('autoSelect');
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
				selectI(-1);
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
				selectI(-1);
			}
			break;
		
		default: break;
	}
	
	return gURLBar._onKeyPress(e);
};

moduleAid.UNLOADMODULE = function() {
	cancelSelect();
};
