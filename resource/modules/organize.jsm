moduleAid.VERSION = '1.1.5';

// This is for the modified functions, since they take the scope of the sandbox these wouldn't be reachable
this.__defineGetter__('openUILinkIn', function() { return window.openUILinkIn; });
this.__defineGetter__('whereToOpenLink', function() { return window.whereToOpenLink; });
this.__defineGetter__('Tabmix', function() { return window.Tabmix; });

this.escaped = false;
this.types = [];
this.deletedIndex = null;
this.deletedText = null;
this.popupClickMethod = "onPopupClick";

// Called when a search ends in the location bar
this.delayOrganize = function() {
	escaped = false;
	timerAid.init('delayOrganize', organize, 100);
};

// This method simply cleans the selection in the autocomplete popup
this.doIndexes = function(selected, current) {
	if(selected == undefined) { selected = -1; }
	if(current == undefined) { current = -1; }
	
	richlistbox.selectedIndex = selected;
	richlistbox.currentIndex = current;
	richlistbox._actualIndex = (current > -1) ? current : selected;
};

// Goes by each 'type' to be organized and organizes each entry of type 'type'
this.organize = function() {
	if(!panelState || escaped) { return; }
	
	dispatch(panel, { type: 'obpBeginOrganize', cancelable: false });
	
	doIndexes();
	var nodes = [];
	
	// First we see what order the nodes should be in
	for(var type in types) {
		nodes[types[type]] = [];
	}
	
	for(var i=0; i<richlist.length; i++) {
		richlist[i].onmouseover = function() {
			doIndexes(richlistbox.selectedIndex, richlistbox.currentIndex);
		}
		var type = getEntryType(richlist[i].getAttribute('type'));
		nodes[types[type]].push(richlist[i]);
	}
	
	// Now we append all of them
	for(var type in types) {
		for(var node in nodes[types[type]]) {
			if(nodes[types[type]][node].collapsed) {
				if(nodes[types[type]][node].getAttribute('text') == gURLBar.value) {
					nodes[types[type]][node].removeAttribute('collapsed');
					nodes[types[type]][node] = richlistbox._appendChild(nodes[types[type]][node]);
				} else {
					// Remove collapsed entries so they're not triggered when hitting the up and down keys
					richlistbox.removeChild(nodes[types[type]][node]);
				}
			} else {
				nodes[types[type]][node] = richlistbox._appendChild(nodes[types[type]][node]);
			}
		}
	}
	
	dispatch(panel, { type: 'obpEndOrganize', cancelable: false });
	
	panel.adjustHeight();
};

this.getTypes = function() {
	// entries are sorted in the order they appear in this list
	// 'agrenon' is for Peers extension entries
	// 'smarterwiki' is for FastestFox extension entries
	// 'omnibar' is for omnibar added search suggestions
	// 'EE' is for everything else; 
	types = [
		prefAid.organize0,
		prefAid.organize1,
		prefAid.organize2,
		prefAid.organize3,
		prefAid.organize4,
		prefAid.organize5
	];
	
	// Remove entries that aren't needed as to reduce the number of loops
	if(!prefAid.agrenon) {
		removeEntry('agrenon');
	}
	if(!prefAid.smarterwiki) { 
		removeEntry('smarterwiki'); 
	}
};

this.getEntryType = function(aType) {
	for(var type in types) {
		if(types[type] == 'EE') {
			var returnEE = type;
		}
		else if(aType.indexOf(types[type]) > -1) {
			return type;
		}
	}
	return returnEE;
};

this.removeEntry = function(str) {
	for(var i=0; i<types.length; i++) {
		if(types[i] == str) {
			types.splice(i, 1);
			return;
		}
	}
};

// Our takes on key navigation from gURLBar.onkeypress(event), if returns false, original onkeypress is called
this.urlBarKeyDown = function(e) {
	// Sometimes the ontextentered attribute is reset (for some reason), this leads to double tabs being opened
	checkOnTextEntered();
	
	var key = e.keyCode;
	var tab = false;
	if(key == e.DOM_VK_TAB && gURLBar.tabScrolling && panelState) {
		key = (e.shiftKey) ? e.DOM_VK_UP : e.DOM_VK_DOWN;
		tab = true;
	}
	
	dispatch(gURLBar, { type: 'obpBeginKeyDown', cancelable: false, detail: { keyEvent: e } });
	
	switch(key) {
		case e.DOM_VK_PAGE_UP:
		case e.DOM_VK_PAGE_DOWN:
		case e.DOM_VK_UP:
		case e.DOM_VK_DOWN:
			// No point in doing anything if popup isn't open
			// Simply return default action
			if(!panelState) {
				gURLBar.controller.startSearch(gURLBar.value);
				return false;
			}
	
			// Just discriminating using the same criteria the original onKeyPress does
			if (e.defaultPrevented) { return false; } // can't put this before switch or enter won't be triggered
			if (gURLBar.disableKeyNavigation || e.ctrlKey || e.altKey) { return false; }
			
			// There's something wrong with using tab, it focuses other elements
			// this cancels that action allowing to surf through the popup
			if(tab) {
				e.preventDefault();
				e.stopPropagation();
			}
			
			var currentIndex = richlistbox.currentIndex;
			switch(key) {
				case e.DOM_VK_PAGE_UP:
				case e.DOM_VK_UP:
					if(currentIndex > -1) {
						currentIndex = (key == e.DOM_VK_PAGE_UP && currentIndex > 0) ? Math.max(currentIndex -5, 0) : currentIndex -1;
					} else {
						currentIndex = richlist.length-1;
					}
					break;
				case e.DOM_VK_PAGE_DOWN:
				case e.DOM_VK_DOWN:
					if(currentIndex < richlist.length-1) {
						currentIndex = (key == e.DOM_VK_PAGE_DOWN) ? Math.min(currentIndex +5, richlist.length-1) : currentIndex +1;
					} else {
						currentIndex = -1;
					}
					break;
				default: break;
			}
			
			doIndexes(currentIndex, currentIndex);
			
			if(currentIndex > -1 && richlist[currentIndex] && richlist[currentIndex].getAttribute('url')) {
				gURLBar.value = richlist[currentIndex].getAttribute('url');
			} 
			else if(richlist[0]) {
				gURLBar.value = richlist[0].getAttribute('text');
			}
			
			gURLBar.focus();
			
			// false makes sure it always places the cursor in the end
			return false;
		
		case e.DOM_VK_RETURN:
		case e.DOM_VK_ENTER:
			e.okToProceed = true;
			return fireOnSelect(e);
		
		case e.DOM_VK_ESCAPE:
			escaped = true;
			doIndexes();
			return gURLBar._onKeyPress(e);
		
		case e.DOM_VK_DELETE:
			// Special actions for the del key (such as opening the clear history dialog) should still happen
			// If it's able to delete text from the url bar then do it
			if(e.ctrlKey || gURLBar.selectionStart != gURLBar.selectionEnd || gURLBar.selectionStart != gURLBar.textLength) {
				doIndexes();
				return gURLBar._onKeyPress(e);
			}
			
			if(!panelState) {
				return gURLBar._onKeyPress(e);
			}
			
			// Don't delete before organizing as it can screw up the handler
			if(timerAid.delayOrganize) {
				return false;
			}
			
			// Delete entries from the popup list if applicable
			if(richlistbox.currentIndex > -1) {
				deletedIndex = richlistbox.currentIndex;
				deletedText = richlistbox.currentItem.getAttribute('text');
				richlistbox.removeChild(richlistbox.currentItem);
				
				if(richlist.length == 0) {
					gURLBar.value = deletedText;
					panelState = false;
					doIndexes();
				}
				else {
					if(deletedIndex == richlist.length) {
						deletedIndex--;
					}
					doIndexes(deletedIndex, deletedIndex);
					panel.adjustHeight();
				}
				return true;
			}
			
			return gURLBar._onKeyPress(e);
		
		case e.DOM_VK_LEFT:
		case e.DOM_VK_RIGHT:
		case e.DOM_VK_HOME:
		case e.DOM_VK_END:
		case e.DOM_VK_CONTEXT_MENU:
			doIndexes();
			return gURLBar._onKeyPress(e);
		
		default:
			doIndexes();
			return gURLBar._onKeyPress(e);
	}
};

this.onGoClick = function(aEvent) {
	doIndexes();
	fireOnSelect(aEvent);
};

this.checkOnTextEntered = function() {
	if(gURLBar.getAttribute('ontextentered').indexOf(objName) < 0) {
		gURLBar._ontextentered = gURLBar.getAttribute('ontextentered');
		setAttribute(gURLBar, 'ontextentered', objName+'.fireOnSelect(param);');
	}
};

// Make sure all the paste commands trigger our .overrideURL
// Note that all the returns and checks are just prevention, I have no reason to put them here other than just making sure it works correctly
this.fixContextMenu = function(areWeOrganizing) {
	var getFromHere = document.getAnonymousElementByAttribute(gURLBar, 'anonid', 'textbox-container').childNodes[0];
	var contextMenu = document.getAnonymousElementByAttribute(getFromHere, 'anonid', 'input-box-contextmenu');
	if(!contextMenu) { return; }
	
	var undoItem = contextMenu.getElementsByAttribute('cmd', 'cmd_undo')[0];
	var cutItem = contextMenu.getElementsByAttribute('cmd', 'cmd_cut')[0];
	var pasteItem = contextMenu.getElementsByAttribute('cmd', 'cmd_paste')[0];
	var pasteAndGoItem = contextMenu.getElementsByAttribute('anonid', 'paste-and-go')[0];
	
	if(areWeOrganizing) {
		if(undoItem) {
			listenerAid.add(undoItem, 'command', paste, false);
		}
		if(cutItem) {
			listenerAid.add(cutItem, 'command', paste, false);
		}
		if(pasteItem) {
			listenerAid.add(pasteItem, 'command', paste, false);
		}
		if(pasteAndGoItem) {
			pasteAndGoItem._oncommand = pasteAndGoItem.getAttribute('oncommand');
			setAttribute(pasteAndGoItem, 'oncommand', objName+'.pasteAndGo(event);');
		}
	}
	else {
		if(undoItem) {
			listenerAid.remove(undoItem, 'command', paste, false);
		}
		if(cutItem) {
			listenerAid.remove(cutItem, 'command', paste, false);
		}
		if(pasteItem) {
			listenerAid.remove(pasteItem, 'command', paste, false);
		}
		if(pasteAndGoItem) {
			setAttribute(pasteAndGoItem, 'oncommand', pasteAndGoItem._oncommand);
			delete pasteAndGoItem._oncommand;
		}
	}
};

this.pasteAndGo = function(event) {
	gURLBar.select();
	window.goDoCommand('cmd_paste');
	doIndexes();
	fireOnSelect(event);
};

this.paste = function() {
	doIndexes();
};

this.fireOnSelect = function(e) {
	// We need the enter key to always call it from our handler or it won't work right sometimes
	if(e && e.type == 'keydown' && (e.keyCode == e.DOM_VK_RETURN || e.keyCode == e.DOM_VK_ENTER) && !e.okToProceed) { return; }
	
	if(anyItem) {
		gURLBar.value = anyItem.getAttribute('url');
	}
	doIndexes();
	panelState = false;
	
	// Compatibility fix for Auto-Complete add-on
	// It resets the bar value when bluring, thus completely screwing up here, by putting on a timer we get the same effect after the value is executed.
	// However the blur on a timer can sometimes come make it so it blurs the address bar after a new tab is opened, bluring the new tab address bar and keeping the
	// last opened tab address bar focused, this is a bit of a dirty hack but necessary
	var tempLocation = gURLBar.value;
	var opener = gBrowser.mCurrentBrowser;
	gURLBar.blur();
	
	aSync(function() {
		gURLBar.value = tempLocation;
		Omnibar._handleURLBarCommand(e);
		
		// Attempt to set the correct values in the urlbars of both the opened browser and the opening browser
		gURLBar.reset();
		gBrowser.mCurrentBrowser._userTypedValue = null;
		if(gBrowser.mCurrentBrowser != opener) {
			opener._userTypedValue = null;
		}
	});
};

moduleAid.LOADMODULE = function() {
	// Grab types of entries to populate the organize list
	// Also sets whether Peers/FastestFox is enabled
	getTypes();
	prefAid.listen('organize0', getTypes);
	prefAid.listen('organize1', getTypes);
	prefAid.listen('organize2', getTypes);
	prefAid.listen('organize3', getTypes);
	
	checkOnTextEntered();
	fixContextMenu(true);
	
	richlistbox._appendChild = richlistbox.appendChild;
	richlistbox.appendChild = function(aNode) {
		delayOrganize();
		return richlistbox._appendChild(aNode);
	}
	
	// At first I was going to simply replace this with a pre-written function, but TabMixPlus also changes this function (and it isn't the only one)
	// and there's no way to discriminate without saving at least two pre-written functions, this method seems much more direct
	// QuietUrl moves this function to a backup place, so have to change it there
	if(panel._QuietUrlPopupClickOld) {
		popupClickMethod = "_QuietUrlPopupClickOld";
	}
	toCode.modify(panel, "panel."+popupClickMethod, [
		['if (aEvent.button == 2)',
			 ' if(aEvent.button == 2 &&this.richlistbox.currentItem) {'
			+" 	this.input.value = this.richlistbox.currentItem.getAttribute('url') || this.richlistbox.currentItem.getAttribute('text');"
			+' }'
			+' if (aEvent.button == 2)'
		],
		['controller.handleEnter(true);', 'fireOnSelect(aEvent);']
	]);
	
	// mPopupOpen simply is not reliable in some cases, f.i. for a split second after deleting all entries it thinks the popup is closed when it is not,
	// so it doesn't actually close when I want it to
	toCode.modify(panel, "panel.closePopup", [
		['this.mPopupOpen', 'panelState']
	]);
	
	richlistbox._actualIndex = -1;
	richlistbox.__defineGetter__("_actualItem", function() {
		if(this._actualIndex > -1 && this._actualIndex < this.childNodes.length) {
			return this.childNodes[this._actualIndex];
		}
		this._actualIndex = -1;
		return null;
	});
	
	addHandler(keyHandlers, urlBarKeyDown, 200);
	addHandler(unSelectHandlers, doIndexes, 100);
	
	listenerAid.add(gURLBar, 'obpSearchComplete', delayOrganize);
};

moduleAid.UNLOADMODULE = function() {
	timerAid.cancel('delayOrganize');
	
	listenerAid.remove(gURLBar, 'obpSearchComplete', delayOrganize);
	
	removeHandler(keyHandlers, urlBarKeyDown, 200);
	removeHandler(unSelectHandlers, doIndexes, 100);
	
	prefAid.unlisten('organize0', getTypes);
	prefAid.unlisten('organize1', getTypes);
	prefAid.unlisten('organize2', getTypes);
	prefAid.unlisten('organize3', getTypes);
	
	// We remove every entry from the richlist when unloading organize module to prevent any conflicts
	panelState = false;
	while(richlist.length > 0) {
		richlistbox.removeChild(richlist[0]);
	}
	
	setAttribute(gURLBar, "ontextentered", gURLBar._ontextentered);
	delete gURLBar._ontextentered;
	
	fixContextMenu(false);
	
	richlistbox.appendChild = richlistbox._appendChild;
	delete richlistbox._appendChild;
	
	toCode.revert(panel, "panel."+popupClickMethod);
	toCode.revert(panel, "panel.closePopup");
	
	delete richlistbox._actualIndex;
	delete richlistbox._actualItem;
};
