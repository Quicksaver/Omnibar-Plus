var organizing = false;
var willOrganize = false;
var escaped = false;
var selectedSuggestion = false;
var LBHelpers = (typeof(LocationBarHelpers) != 'undefined') ? true : false;
var types = [];
var deletedIndex = null;
var deletedText = null;

var goButton = document.getElementById('go-button');
var panel = document.getElementById('PopupAutoCompleteRichResult');
var richlistbox = panel.richlistbox;
var richlist = richlistbox.childNodes;

// helper objects to get current popup status and set it
__defineGetter__('panelState', function() {
	// For some reason, just mPopupOpen and popupOpen aren't reliable in every case
	return (!panel.mPopupOpen && panel.state != "open") ? false : true;
});
__defineSetter__('panelState', function(val) {
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
			if(panel.mPopupOpen) { panel.mPopupOpen = false; }
			if(panel.popupOpen) { panel.popupOpen = false; }
			if(panel.state != 'closed') { panel.state = 'closed'; }
		});
	}
});

// Called when a search begins and ends in the location bar
var searchBegin = function() {
	if(prefAid.organizePopup) {
		willOrganize = false;
		selectedSuggestion = false;
		escaped = false;
		doIndexes();
	}
	if(LBHelpers) {
		LocationBarHelpers._searchBegin();
	}
};
var searchComplete = function() {
	if(prefAid.organizePopup) {
		popupshowing();
	}
	if(LBHelpers) {
		LocationBarHelpers._searchComplete();
	}
};

// Handler for when the autocomplete pops up
var popupshowing = function() {
	if(escaped) { return false; }
	willOrganize = true;
	timerAid.init('popupshowing', organize, 100);
	return true;
};

// This method simply cleans the selection in the autocomplete popup
var doIndexes = function(selected, current) {
	if(selected == undefined) { selected = -1; }
	if(current == undefined) { current = -1; }
	
	richlistbox.selectedIndex = selected;
	richlistbox.currentIndex = current;
	richlistbox._actualIndex = (current > -1) ? current : selected;
};

// Goes by each 'type' to be organized and organizes each entry of type 'type'
var organize = function() {
	if(!panelState || escaped) { return; }
	
	var originalSelectedIndex = richlistbox.selectedIndex;
	var originalCurrentIndex = richlistbox.currentIndex;
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
					nodes[types[type]][node] = richlistbox.appendChild(nodes[types[type]][node]);
				} else {
					// Remove collapsed entries so they're not triggered when hitting the up and down keys
					richlistbox.removeChild(nodes[types[type]][node]);
				}
			} else {
				nodes[types[type]][node] = richlistbox.appendChild(nodes[types[type]][node]);
			}
		}
	}
	
	// Speak words auto select first result feature is overriden by ours
	if(originalSelectedIndex >= 0
	&& (originalSelectedIndex >= richlist.length || !richlist[originalSelectedIndex] || !selectedSuggestion)) {
		originalSelectedIndex = -1;
	}
	if(originalSelectedIndex == -1 && prefAid.autoSelect && richlist.length > 0) {
		originalSelectedIndex = 0;
	}
	if(originalCurrentIndex >= 0
	&& (originalCurrentIndex >= richlist.length || !richlist[originalCurrentIndex] || !selectedSuggestion)) {
		originalCurrentIndex = -1;
	}
	if(originalCurrentIndex == -1 && prefAid.autoSelect && richlist.length > 0) {
		originalCurrentIndex = 0;
	}
	doIndexes(originalSelectedIndex, originalCurrentIndex);
	
	willOrganize = false;
	panel.adjustHeight();
};

var getTypes = function() {
	// entries are sorted in the order they appear in this list
	// 'agrenon' is for Peers extension entries
	// 'smarterwiki' is for FastestFox extension entries
	// 'omnibar' is for omnibar added search suggestions
	// 'EE' is for everything else; 
	types = [
		prefAid.organize1,
		prefAid.organize2,
		prefAid.organize3,
		prefAid.organize4
	];
	
	// Remove entries that aren't needed as to reduce the number of loops
	if(typeof(agrenonLoader) == 'undefined') { 
		removeEntry('agrenon');
		prefAid.agrenon = false;
	} else {
		prefAid.agrenon = true;
	}
	if(typeof(SmarterWiki) == 'undefined') { 
		removeEntry('smarterwiki'); 
		prefAid.smarterwiki = false;
	} else {
		prefAid.smarterwiki = true;
	}
};

var getEntryType = function(aType) {
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

var removeEntry = function(str) {
	for(var i=0; i<types.length; i++) {
		if(types[i] == str) {
			types.splice(i, 1);
			return;
		}
	}
};

// Our takes on key navigation from gURLBar.onkeypress(event), if returns false, original onkeypress is called
var urlBarKeyDown = function(e) {
	// Compatibility with the UI Enhancer add-on
	// don't handle keystrokes on it's editing box
	if(hasAncestor(document.commandDispatcher.focusedElement, document.getElementById('UIEnhancer_URLBar_Editing_Stack_Text'))) { return true; }
	
	// Sometimes the ontextentered attribute is reset (for some reason), this leads to double tabs being opened
	checkOnHandlers();
	
	// Just discriminating using the same criteria the original onKeyPress does
	if (e.target.localName != "textbox") { return false; }
	
	var key = e.keyCode;
	var tab = false;
	if(key == e.DOM_VK_TAB && gURLBar.tabScrolling && panelState) {
		key = (e.shiftKey) ? e.DOM_VK_UP : e.DOM_VK_DOWN;
		tab = true;
	}
	
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
			if (e.defaultPrevented || e.getPreventDefault()) { return false; } // can't put this before switch or enter won't be triggered
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
						currentIndex = (key == e.DOM_VK_PAGE_UP) ? Math.max(currentIndex -5, -1) : currentIndex -1;
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
			selectedSuggestion = true;
			
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
			panelState = false;
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
			if(willOrganize) {
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
						
		default:
			doIndexes();
			return gURLBar._onKeyPress(e);
	}
};

// Set urlbar ontextentered attribute to work with our handler
var checkOnHandlers = function() {
	if(gURLBar.getAttribute('ontextentered').indexOf(objName) < 0) {
		gURLBar._ontextentered = gURLBar.getAttribute('ontextentered');
		gURLBar.setAttribute('ontextentered', objName+'.fireOnSelect(param);');
	}
	if(goButton.getAttribute('onclick').indexOf('objName') < 0) {
		goButton._onclick = goButton.getAttribute('onclick');
		goButton.setAttribute('onclick', objName+'.onGoClick(event);'); 
	}	
};

var onGoClick = function(aEvent) {
	// This comes from TMP_goButtonClick() (from Tab Mix Plus), the original onclick is simply gURLBar.handleCommand()
	if(goButton._onclick.indexOf('TMP') > -1 && aEvent.button == 1 && gURLBar.value == gBrowser.currentURI.spec) {
		gBrowser.duplicateTab(gBrowser.mCurrentTab);
	}
	else if(aEvent.button != 2) {
		doIndexes();
		fireOnSelect(aEvent);
	}
};

// Make sure all the paste commands trigger our .overrideURL
// Note that all the returns and checks are just prevention, I have no reason to put them here other than just making sure it works correctly
var fixContextMenu = function() {
	// Don't know exactly in which version of firefox .inputBox was removed, I just noticed it in 9.0a1
	var getFromHere = gURLBar.inputBox || document.getAnonymousElementByAttribute(gURLBar, 'anonid', 'textbox-container').childNodes[0];
	var contextMenu = document.getAnonymousElementByAttribute(getFromHere, 'anonid', 'input-box-contextmenu');
	if(!contextMenu) { return; }
	
	var undoItem = contextMenu.getElementsByAttribute('cmd', 'cmd_undo')[0];
	var cutItem = contextMenu.getElementsByAttribute('cmd', 'cmd_cut')[0];
	var pasteItem = contextMenu.getElementsByAttribute('cmd', 'cmd_paste')[0];
	var pasteAndGoItem = contextMenu.getElementsByAttribute('anonid', 'paste-and-go')[0];
	
	if(prefAid.organizePopup) {
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
			if(!pasteAndGoItem._oncommand) {
				pasteAndGoItem._oncommand = pasteAndGoItem.getAttribute('oncommand');
			}
			pasteAndGoItem.setAttribute('oncommand', objName+'.pasteAndGo(event);');
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
		if(pasteAndGoItem && pasteAndGoItem._oncommand) {
			pasteAndGoItem.setAttribute('oncommand', pasteAndGoItem._oncommand);
		}
	}
};

var pasteAndGo = function(event) {
	gURLBar.select();
	goDoCommand('cmd_paste');
	doIndexes();
	fireOnSelect(event);
};

var paste = function() {
	doIndexes();
};

var fireOnSelect = function(e) {
	// We need the enter key to always call it from our handler or it won't work right sometimes
	if(e && e.type == 'keydown' && (e.keyCode == e.DOM_VK_RETURN || e.keyCode == e.DOM_VK_ENTER) && !e.okToProceed) { return; }
	
	if(richlistbox.currentItem) {
		gURLBar.value = richlistbox.currentItem.getAttribute('url');
	}
	else if(richlistbox.selectedItem) {
		gURLBar.value = richlistbox.selectedItem.getAttribute('url');
	}
	else if(richlistbox._actualItem) {
		gURLBar.value = richlistbox._actualItem.getAttribute('url');
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

// Toggle Organize Functionality, we'll use a delay to let the popup fill up before organizing it
var toggleOrganize = function() {
	// Compatibility with latest versions of firefox (aurora FF11 as far as I can tell doesn't have LocationBarHelpers anymore)
	// Setting these always, the switch On/Off are inside the functions themselves
	gURLBar.setAttribute('onsearchbegin', objName+'.searchBegin();');
	gURLBar.setAttribute('onsearchcomplete', objName+'.searchComplete();');
	
	if(prefAid.organizePopup && !organizing) {
		gURLBar._onKeyPress = gURLBar.onKeyPress;
		gURLBar.onKeyPress = function(aEvent) {
			return urlBarKeyDown(aEvent);
		}
		
		checkOnHandlers();
		fixContextMenu();
		
		richlistbox._appendChild = richlistbox.appendChild;
		richlistbox.appendChild = function(aNode) {
			if(willOrganize) { popupshowing(); }
			return richlistbox._appendChild(aNode);
		}
		
		// For the auto-select the first result feature
		// Basically a copy/paste from Speak Words equivalent functionality
		gURLBar.__defineGetter__("willHandle", function() {
			// Potentially it's a url if there's no spaces
			var search = this.controller.searchString.trim();
			if (search.match(/ /) == null) {
				try {
					// Quit early if the input is already a URI
					return Services.io.newURI(gURLBar.value, null, null);
				}
				catch(ex) {}
				
				try {
					// Quit early if the input is domain-like (e.g., site.com/page)
					return Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService).getBaseDomainFromHost(gURLBar.value);
				}
				catch(ex) {}
			}
			
			// Check if there's an search engine registered for the first keyword
			var keyword = search.split(/\s+/)[0];
			return Services.search.getEngineByAlias(keyword);
		});
		
		// At first I was going to simply replace this with a pre-written function, but TabMixPlus also changes this function and there's no way to
		// discriminate without saving at least two pre-written functions, this method seems much more direct
		panel._onPopupClick = panel.onPopupClick;
		panel.onPopupClick = modifyFunction(panel.onPopupClick, [
			['if (aEvent.button == 2) {',
			<![CDATA[
			if (aEvent.button == 2) {
				if(this.richlistbox.currentItem) {
					this.input.value = this.richlistbox.currentItem.getAttribute('url') || this.richlistbox.currentItem.getAttribute('text');
				}
			]]>
			],
			['controller.handleEnter(true);',
			'this.input.{([objName])}.fireOnSelect(aEvent);'
			]
		]);
		
		// mPopupOpen simply is not reliable in some cases, f.i. for a split second after deleting all entries it thinks the popup is closed when it is not,
		// so it doesn't actually close when I want it to
		panel._closePopup = panel.closePopup;
		panel.closePopup = modifyFunction(panel.closePopup, [
			['this.mPopupOpen',
			'{([objName])}.panelState'
			]
		]);
		
		richlistbox._actualIndex = -1;
		richlistbox.__defineGetter__("_actualItem", function() {
			if(this._actualIndex > -1 && this._actualIndex < this.childNodes.length) {
				return this.childNodes[this._actualIndex];
			}
			this._actualIndex = -1;
			return null;
		});
		
		organizing = true;
	} 
	else if(!prefAid.organizePopup && organizing) {
		gURLBar.onKeyPress = gURLBar._onKeyPress;
		
		// Changed in checkOnHandlers()
		gURLBar.setAttribute("ontextentered", gURLBar._ontextentered);
		goButton.setAttribute('onclick', goButton._onclick);
		
		fixContextMenu();
		
		richlistbox.appendChild = richlistbox._appendChild;
		
		panel.onPopupClick = panel._onPopupClick;
		panel.closePopup = panel._closePopup;
		
		organizing = false;
	}
};

// Grab types of entries to populate the organize list
// Also sets whether Peers/FastestFox is enabled
getTypes();
prefAid.listen('organize1', getTypes);
prefAid.listen('organize2', getTypes);
prefAid.listen('organize3', getTypes);
prefAid.listen('organize4', getTypes);

toggleOrganize();
