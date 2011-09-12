var OmnibarPlusOptions = {
	init: function() {
		// Move omnibar's preferences elements into their tabs
		OmnibarPlusOptions.pane = document.getElementById('mainPane');
		OmnibarPlusOptions.omnibartab = document.getElementById('tabPanels').firstChild;
		
		// Some ids for faster fetching
		OmnibarPlusOptions.tree = document.getElementById('orderList');
		OmnibarPlusOptions.list = OmnibarPlusOptions.tree.view;
		OmnibarPlusOptions.organize = {
			1: document.getElementById('extensions.omnibarplus.organize.1'),
			2: document.getElementById('extensions.omnibarplus.organize.2'),
			3: document.getElementById('extensions.omnibarplus.organize.3'),
			4: document.getElementById('extensions.omnibarplus.organize.4')
		};
		OmnibarPlusOptions.labels = {
			EE: document.getElementById('hiddenOrderListLabel_EE').value,
			agrenon: document.getElementById('hiddenOrderListLabel_agrenon').value,
			smarterwiki: document.getElementById('hiddenOrderListLabel_smarterwiki').value,
			omnibar: document.getElementById('hiddenOrderListLabel_omnibar').value
		};
		
		// Fastefox/Peers enabled
		OmnibarPlusOptions.agrenon = Application.prefs.getValue("extensions.omnibarplus.agrenon", null);
		OmnibarPlusOptions.smarterwiki = Application.prefs.getValue("extensions.omnibarplus.smarterwiki", null);
		
		var j = 0;
		var h = OmnibarPlusOptions.pane.childNodes.length;
		for(var i=0; i<h; i++) {
			if(OmnibarPlusOptions.pane.childNodes[j].nodeName == 'preferences' || OmnibarPlusOptions.pane.childNodes[j].nodeName  == 'tabbox') {
				j++;
			} else {
				OmnibarPlusOptions.omnibartab.appendChild(OmnibarPlusOptions.pane.childNodes[j]);
			}
		}
		
		// The textboxes lose their values for some reason so we need to repopulate them, they stay attached to their preference however
		OmnibarPlusOptions.textboxes = document.getElementsByTagName('textbox');
		for(var i=0; i<OmnibarPlusOptions.textboxes.length; i++) {
			if(OmnibarPlusOptions.textboxes[i].hidden) { continue; }
			OmnibarPlusOptions.textboxes[i].value = document.getElementById(OmnibarPlusOptions.textboxes[i].getAttribute('preference')).value;
		}
		
		OmnibarPlusOptions.toggleAnimated();
		OmnibarPlusOptions.toggleOrganize();
		OmnibarPlusOptions.fillListRows();
	},
	
	toggleAnimated: function() {
		var o = document.getElementById('animatedCheckbox').checked;
		var menu = document.getElementById('animatedMenulist');
		if(o) {
			menu.removeAttribute('disabled');
		} else {
			menu.setAttribute('disabled', 'true');
		}
	},
	
	toggleOrganize: function() {
		var o = document.getElementById('organizeCheckbox').checked;
		var nodes = document.getElementsByClassName('organize');
		for(var i=0; i<nodes.length; i++) {
			if(o) {
				nodes[i].removeAttribute('disabled');
			} else {
				nodes[i].setAttribute('disabled', 'true');
			}
		}
		
		if(!o) {
			document.getElementById('orderList').view.selection.clearSelection();
		}
	},
	
	fillListRows: function() {
		var i = 0;
		var j = 0;
		
		while(i < OmnibarPlusOptions.list.rowCount) {
			var item = OmnibarPlusOptions.list.getItemAtIndex(i);
			
			j++;
			if(!OmnibarPlusOptions.organize[j]) {
				item.setAttribute('hidden', 'true');
				continue;
			}
			
			var value = OmnibarPlusOptions.organize[j].value;
			if( (value == 'agrenon' && !OmnibarPlusOptions.agrenon)
			|| (value == 'smarterwiki' && !OmnibarPlusOptions.smarterwiki) ) {
				continue;
			}
			
			item.setAttribute('value', value);
			var cells = item.childNodes[0].childNodes;
			cells[1].setAttribute('label', OmnibarPlusOptions.labels[value]);
			
			i++;
		}
	},
	
	moveListRow: function(down) {
		var curIndex = OmnibarPlusOptions.list.selection.currentIndex;
		if(curIndex == -1
		|| (down && curIndex == 3)
		|| (!down && curIndex == 0)) { return; }
		
		var curValue = OmnibarPlusOptions.list.getItemAtIndex(curIndex).getAttribute('value');
		
		for(var i=1; i<=4; i++) {
			if(OmnibarPlusOptions.organize[i].value == curValue) {
				var j = (down) ? i+1 : i-1;
				if(!OmnibarPlusOptions.organize[j]) { return; }
				
				var moveValue = OmnibarPlusOptions.organize[j].value;
				while( (moveValue == 'agrenon' && !OmnibarPlusOptions.agrenon)
				|| (moveValue == 'smarterwiki' && !OmnibarPlusOptions.smarterwiki) ) {
					j = (down) ? j+1 : j-1;
					if(!OmnibarPlusOptions.organize[j]) { return; }
					
					moveValue = OmnibarPlusOptions.organize[j].value;
				}
				break;
			}
		}
		
		OmnibarPlusOptions.organize[i].value = moveValue;
		OmnibarPlusOptions.organize[j].value = curValue;
		
		var i = 0;
		while(i < OmnibarPlusOptions.list.rowCount) {
			var item = OmnibarPlusOptions.list.getItemAtIndex(i);
			var itemValue = item.getAttribute('value');
			if(itemValue == curValue) {
				item.setAttribute('value', moveValue);
				item.childNodes[0].childNodes[1].setAttribute('label', OmnibarPlusOptions.labels[moveValue]);
			} 
			else if(itemValue == moveValue) {
				item.setAttribute('value', curValue);
				item.childNodes[0].childNodes[1].setAttribute('label', OmnibarPlusOptions.labels[curValue]);
				OmnibarPlusOptions.list.selection.select(i);
			}
			i++;
		}
		
		OmnibarPlusOptions.tree.focus();
	}
}

window.addEventListener("load", OmnibarPlusOptions.init, false);