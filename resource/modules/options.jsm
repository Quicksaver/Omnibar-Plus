moduleAid.VERSION = '1.0.1';
moduleAid.VARSLIST = ['tree', 'list', 'getLabel', 'removeDisabled', 'moveListRow', 'selectAndFocus', 'getCell', 'inRange', 'blurOnDisabled', 'blurOrderList', 'onOverlayLoad', 'onOverlayUnload'];

this.__defineGetter__('tree', function() { return document.getElementById('orderList'); });
this.__defineGetter__('list', function() { return tree.view; });

this.getLabel = function(cell) {
	cell.setAttribute('label', stringsAid.get('options', 'organizeList.'+document.getElementById(cell.getAttribute('preference')).value));
};

this.removeEntries = function() {
	var toHide = ['agrenon', 'smarterwiki'];
	for(var h = 0; h < toHide.length; h++) {
		for(var i = 0; i <= 3; i++) {
			if(prefAid['organize'+i] == toHide[h]) {
				document.getElementById('treeitem-'+i).hidden = !prefAid[toHide[h]];
			}
		}
	}
	
	var j = 1;
	for(var i = 0; i <= 3; i++) {
		document.getElementById('treecell-'+i).previousSibling.setAttribute('label', j);
		if(!document.getElementById('treeitem-'+i).hidden) {
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
	var change = document.createEvent('Event');
	change.initEvent('change', true, false);
	getCell(i).dispatchEvent(change);
	
	getCell(j).setAttribute('value', curValue);
	var change = document.createEvent('Event');
	change.initEvent('change', true, false);
	getCell(j).dispatchEvent(change);
	
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
	var list = document.getElementById('orderList');
	if(list.getAttribute('disabled') == 'true') {
		list.view.selection.clearSelection();
	}
};

this.onOverlayLoad = function() {
	removeEntries();
	setWatchers(tree);
	tree.addAttributeWatcher('disabled', blurOnDisabled);
};

this.onOverlayUnload = function() {
	setWatchers(tree, true);
};

moduleAid.LOADMODULE = function() {
	window.Options._updateDependents = window.Options.updateDependents;
	window.Options.updateDependents = function(c) { return; };
};

moduleAid.UNLOADMODULE = function() {
	window.Options.updateDependents = window.Options._updateDependents;
	delete window.Options._updateDependents;
	
	if(tree && tree.removeAttributeWatcher) {
		tree.removeAttributeWatcher('disabled', blurOnDisabled);
	}
};
