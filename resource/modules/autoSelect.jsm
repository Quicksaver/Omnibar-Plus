moduleAid.VERSION = '1.0.1';
moduleAid.VARSLIST = ['dontSelect', 'selectI', 'autoSelect', 'delaySelect', 'cancelSelect', 'keySelect'];

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
	
	selectI(0);
	return true;
};

this.delaySelect = function() {
	if(dontSelect) { return; }
	
	selectI(-1);
	if(!timerAid.autoSelect && autoSelect()) {
		timerAid.init('autoSelect', autoSelect, 200, 'slack');
	}
};

this.cancelSelect = function() {
	timerAid.cancel('autoSelect');
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
			dontSelect = true;
			break;
		
		case e.DOM_VK_DELETE:
			if(e.ctrlKey || gURLBar.selectionStart != gURLBar.selectionEnd || gURLBar.selectionStart != gURLBar.textLength) {
				selectI(-1);
			}
			return gURLBar._onKeyPress(e);
		
		default: break;
	}
	
	return gURLBar._onKeyPress(e);
};

moduleAid.UNLOADMODULE = function() {
	cancelSelect();	
};
