moduleAid.VERSION = '1.1.0';

this.__defineGetter__('tree', function() { return $('orderList'); });
this.__defineGetter__('list', function() { return tree.view; });

this.getLabel = function(cell) {
	cell.setAttribute('label', stringsAid.get('options', 'organizeList.'+$(cell.getAttribute('preference')).value));
};

this.removeEntries = function() {
	var toHide = ['agrenon', 'smarterwiki'];
	for(var h = 0; h < toHide.length; h++) {
		for(var i = 0; i <= 5; i++) {
			if(prefAid['organize'+i] == toHide[h]) {
				$('treeitem-'+i).hidden = !prefAid[toHide[h]];
			}
		}
	}
	
	var j = 1;
	for(var i = 0; i <= 5; i++) {
		$('treecell-'+i).previousSibling.setAttribute('label', j);
		if(!$('treeitem-'+i).hidden) {
			j++;
		}
	}		
};

this.moveListRow = function(down) {
	var i = list.selection.currentIndex;
	if(!inRange(i)) { return; }
	
	var j = (down) ? i+1 : i-1;
	if(!inRange(j)) {
		selectAndFocus(i);
		return;
	}
	
	var curValue = getCell(i).getAttribute('value');
	var moveValue = getCell(j).getAttribute('value');
	while(typeof(prefAid[moveValue]) != 'undefined' && !prefAid[moveValue]) {
		j = (down) ? j+1 : j-1;
		if(!inRange(j)) {
			selectAndFocus(i);
			return;
		}
		
		moveValue = getCell(j).getAttribute('value');
	}
	
	getCell(i).setAttribute('value', moveValue);
	dispatch(getCell(i), { type: 'change', cancelable: false });
	
	getCell(j).setAttribute('value', curValue);
	dispatch(getCell(j), { type: 'change', cancelable: false });
	
	selectAndFocus(j);
};

this.selectAndFocus = function(i) {
	list.selection.select(i);
	tree.focus();
};

this.getCell = function(i) {
	return list.getItemAtIndex(i).getElementsByAttribute('preference-editable', 'true')[0];
};

this.inRange = function(i) {
	return (i < 0 || i >= list.rowCount) ? false : true;
};

this.blurOnDisabled = function(attr, oldval, newval) {
	if(newval == 'true') {
		list.selection.clearSelection();
	}
};

this.blurOrderList = function() {
	if($('orderList').getAttribute('disabled') == 'true') {
		$('orderList').view.selection.clearSelection();
	}
};

this.onOverlayLoad = function() {
	if(window.willClose) { return; }
	
	if(document.baseURI == Addon.optionsURL) {
		$('omnibarTab').hidden = true;
		$('omnibarTabBox').selectedIndex = 1;
	}
	
	removeEntries();
	objectWatcher.addAttributeWatcher(tree, 'disabled', blurOnDisabled);
};

this.handleOmnibarWindow = function() {
	if(!Addon.optionsURL) {
		aSync(handleOmnibarWindow);
		return;
	}
	
	if(document.baseURI == Addon.optionsURL) {
		// If Omnibar is enabled, we should use its preferences dialog, it contains our own as well, and there are dependencies on it that would otherwise fail.
		if(prefAid.omnibar) {
			// Close it as it's done being overlayed, to let it fully initialize first.
			window.willClose = true;
			observerAid.add(closePlusWindow, 'window-overlayed');
			return;
		}
	} else {
		window.Options._updateDependents = window.Options.updateDependents;
		window.Options.updateDependents = function(c) { return; };
	}
};

this.closePlusWindow = function(aSubject) {
	if(window == aSubject) {
		observerAid.remove(closePlusWindow, 'window-overlayed');
		window.close();
		if(!windowMediator.callOnMostRecent(function(aWindow) { aWindow.focus(); return true; }, null, "chrome://omnibar/content/options.xul")) {
			Services.wm.getMostRecentWindow('navigator:browser').openDialog("chrome://omnibar/content/options.xul", '', 'chrome,resizable=false');
		}
	}
};

moduleAid.LOADMODULE = function() {
	handleOmnibarWindow();
};

moduleAid.UNLOADMODULE = function() {
	objectWatcher.removeAttributeWatcher(tree, 'disabled', blurOnDisabled);
	
	if(window.Options && window.Options._updateDependents) {
		window.Options.updateDependents = window.Options._updateDependents;
		delete window.Options._updateDependents;
	}
};
