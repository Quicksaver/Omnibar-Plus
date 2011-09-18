var OmnibarPlus = {
	preinit: function() {
		OmnibarPlus.timerAid.init('init', OmnibarPlus.init, 500);
		OmnibarPlus.listenerAid.remove(window, "load", OmnibarPlus.preinit, false);
	},
	
	init: function() {
		if(typeof(Omnibar) == 'undefined') { return; }
		
		OmnibarPlus.F6 = Application.prefs.get("extensions.omnibarplus.f6");
		OmnibarPlus.middleClick = Application.prefs.get("extensions.omnibarplus.middleClick");
		OmnibarPlus.organizePopup = Application.prefs.get("extensions.omnibarplus.organizePopup");
		OmnibarPlus.animated = Application.prefs.get("extensions.omnibarplus.animated");
		OmnibarPlus.animatedScheme = Application.prefs.get("extensions.omnibarplus.animatedScheme");
		OmnibarPlus.engineFocus = Application.prefs.get("extensions.omnibarplus.engineFocus");
		OmnibarPlus.popupStyle = Application.prefs.get("extensions.omnibar.popupstyle");
		OmnibarPlus.organizeList = {
			organize1: Application.prefs.get("extensions.omnibarplus.organize.1"),
			organize2: Application.prefs.get("extensions.omnibarplus.organize.2"),
			organize3: Application.prefs.get("extensions.omnibarplus.organize.3"),
			organize4: Application.prefs.get("extensions.omnibarplus.organize.4")
		};
		
		OmnibarPlus.agrenon = Application.prefs.get("extensions.omnibarplus.agrenon");
		OmnibarPlus.smarterwiki = Application.prefs.get("extensions.omnibarplus.smarterwiki");
		
		OmnibarPlus.organizing = false;
		OmnibarPlus.willOrganize = false;
		
		// OS string
		OmnibarPlus.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		
		OmnibarPlus.goButton = document.getElementById('go-button');
		OmnibarPlus.engineName = document.getElementById('omnibar-defaultEngineName');
		OmnibarPlus.panel = document.getElementById('PopupAutoCompleteRichResult');
		OmnibarPlus.setWatchers(OmnibarPlus.engineName);
		
		OmnibarPlus.urlbar = document.getElementById('urlbar');
		OmnibarPlus.richlistbox = OmnibarPlus.panel.richlistbox;
		OmnibarPlus.richlist = OmnibarPlus.richlistbox.childNodes;
		
		OmnibarPlus.listenerAid.add(OmnibarPlus.F6, "change", OmnibarPlus.toggleF6);
		OmnibarPlus.listenerAid.add(OmnibarPlus.middleClick, "change", OmnibarPlus.toggleMiddleClick);
		OmnibarPlus.listenerAid.add(OmnibarPlus.organizePopup, "change", OmnibarPlus.toggleOrganize);
		OmnibarPlus.listenerAid.add(OmnibarPlus.animated, "change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.listenerAid.add(OmnibarPlus.animatedScheme, "change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.listenerAid.add(OmnibarPlus.engineFocus, "change", OmnibarPlus.toggleEngineFocus);
		OmnibarPlus.listenerAid.add(OmnibarPlus.popupStyle, "change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.listenerAid.add(OmnibarPlus.organizeList.organize1, "change", OmnibarPlus.getTypes);
		OmnibarPlus.listenerAid.add(OmnibarPlus.organizeList.organize2, "change", OmnibarPlus.getTypes);
		OmnibarPlus.listenerAid.add(OmnibarPlus.organizeList.organize3, "change", OmnibarPlus.getTypes);
		OmnibarPlus.listenerAid.add(OmnibarPlus.organizeList.organize4, "change", OmnibarPlus.getTypes);
		
		// Grab types of entries to populate the organize list
		// Also sets whether Peers/FastestFox is enabled
		OmnibarPlus.getTypes();
		
		OmnibarPlus.toggleF6();
		OmnibarPlus.toggleMiddleClick();		
		OmnibarPlus.toggleOrganize();
		OmnibarPlus.toggleAnimated();
		OmnibarPlus.toggleEngineFocus();
		
		OmnibarPlus.listenerAid.add(window, "unload", OmnibarPlus.deinit, false);
	},
	
	deinit: function() {
		OmnibarPlus.listenerAid.clean();
	},
	
	// Toggle middle click functionality
	toggleMiddleClick: function() {
		document.getElementById('omnibar-in-urlbar').removeAttribute('onclick'); // We need to remove this first
		if(OmnibarPlus.middleClick.value) {
			OmnibarPlus.listenerAid.remove(document.getElementById('omnibar-in-urlbar'), 'click', Omnibar.onButtonClick, false);
			OmnibarPlus.listenerAid.add(document.getElementById('omnibar-in-urlbar'), 'click', OmnibarPlus.onEngineClick, false);
		}
		else {
			OmnibarPlus.listenerAid.remove(document.getElementById('omnibar-in-urlbar'), 'click', OmnibarPlus.onEngineClick, false); 
			OmnibarPlus.listenerAid.add(document.getElementById('omnibar-in-urlbar'), 'click', Omnibar.onButtonClick, false);
		}
	},
	
	// Toggle Organize Functionality, we'll use a delay to let the popup fill up before organizing it
	toggleOrganize: function() {
		if(OmnibarPlus.organizePopup.value && !OmnibarPlus.organizing) {
			//OmnibarPlus.listenerAid.add(OmnibarPlus.panel, 'popuphiding', OmnibarPlus.popupHiding, true);
			gURLBar._onKeyPress = gURLBar.onKeyPress;
			gURLBar.onKeyPress = function(aEvent) {
				return OmnibarPlus.urlBarKeyDown(aEvent);
			}
			
			OmnibarPlus.checkOnHandlers();
			OmnibarPlus.fixContextMenu(true);
			
			LocationBarHelpers.__searchBegin = LocationBarHelpers._searchBegin;
			LocationBarHelpers._searchBegin = function() {
				OmnibarPlus.willOrganize = false;
				OmnibarPlus.doIndexes();
				LocationBarHelpers.__searchBegin();
			};
			
			LocationBarHelpers.__searchComplete = LocationBarHelpers._searchComplete;	
			LocationBarHelpers._searchComplete = function() {
				OmnibarPlus.popupshowing();
				LocationBarHelpers.__searchComplete();
			};
			
			gURLBar._appendChild = gURLBar.appendChild;
			gURLBar.appendChild = function(aNode) {
				if(OmnibarPlus.willOrganize) { OmnibarPlus.popupshowing(); }
				return gURLBar._appendChild(aNode);
			}
			
			OmnibarPlus.organizing = true;
		} 
		else if(!OmnibarPlus.organizePopup.value && OmnibarPlus.organizing) {
			// OmnibarPlus.listenerAid.remove(OmnibarPlus.panel, 'popuphiding', OmnibarPlus.popupHiding, true);
			gURLBar.onKeyPress = gURLBar._onKeyPress;
			
			// Changed in checkOnHandlers()
			gURLBar.setAttribute("ontextentered", gURLBar._ontextentered);
			OmnibarPlus.goButton.setAttribute('onclick', OmnibarPlus.goButton._onclick);
			
			OmnibarPlus.fixContextMenu(false);
			
			LocationBarHelpers._searchComplete = LocationBarHelpers.__searchComplete;
			gURLBar.appendChild = gURLBar._appendChild;
			
			OmnibarPlus.organizing = false;
		}
	},
	
	// Toggle F6 functionality
	toggleF6: function() {
		if(OmnibarPlus.F6.value) {
			document.getElementById('key_omnibarplus_f6').removeAttribute('disabled');
		} else {
			document.getElementById('key_omnibarplus_f6').setAttribute('disabled', 'true');
		}
	},
	
	// Toggle animated effects for the suggestion list
	toggleAnimated: function() {
		if(OmnibarPlus.animated.value) {
			OmnibarPlus.panel.setAttribute('animatedPopup', OmnibarPlus.animatedScheme.value);
		} else {
			OmnibarPlus.panel.removeAttribute('animatedPopup');
		}
	},
	
	// Toggles wether to focus the location bar when changing the search engine
	toggleEngineFocus: function() {
		if(OmnibarPlus.engineFocus.value) {
			OmnibarPlus.engineName.addPropertyWatcher('value', openLocation);
		} else {
			OmnibarPlus.engineName.removePropertyWatcher('value', openLocation);
		}
	},
	
	// Handler for when the autocomplete pops up
	popupshowing: function() {
		OmnibarPlus.willOrganize = true;
		OmnibarPlus.timerAid.init('popupshowing', OmnibarPlus.organize, 100);
		return true;
	},
	
	// Handler for when the autocomplete closes
	// I'm not implementing this one yet, I want to see how it does without it for now
	// leaving it here so I don't forget about it
	/*popuphiding: function() {
		OmnibarPlus.timerAid.init('popuphiding', function() { OmnibarPlus.overrideURL = gURLBar.value; }, 100);
	},*/
	
	// This method simply cleans the selection in the autocomplete popup
	doIndexes: function(selected, current) {
		if(selected == undefined) { var selected = -1; }
		if(current == undefined) { var current = -1; }
		
		OmnibarPlus.richlistbox.selectedIndex = selected;
		OmnibarPlus.richlistbox.currentIndex = current;
	},
	
	getTypes: function() {
		// entries are sorted in the order they appear in this list
		// 'agrenon' is for Peers extension entries
		// 'smarterwiki' is for FastestFox extension entries
		// 'omnibar' is for omnibar added search suggestions
		// 'EE' is for everything else; 
		OmnibarPlus.types = [
			OmnibarPlus.organizeList.organize1.value,
			OmnibarPlus.organizeList.organize2.value,
			OmnibarPlus.organizeList.organize3.value,
			OmnibarPlus.organizeList.organize4.value
		];
		
		// Remove entries that aren't needed as to reduce the number of loops
		if(typeof(agrenonLoader) == 'undefined') { 
			OmnibarPlus.removeEntry('agrenon');
			OmnibarPlus.agrenon.value = false;
		} else {
			OmnibarPlus.agrenon.value = true;
		}
		if(typeof(SmarterWiki) == 'undefined') { 
			OmnibarPlus.removeEntry('smarterwiki'); 
			OmnibarPlus.smarterwiki.value = false;
		} else {
			OmnibarPlus.smarterwiki.value = true;
		}
	},
	
	// Goes by each 'type' to be organized and organizes each entry of type 'type'
	organize: function() {
		if(!OmnibarPlus.panel.popupOpen) { return; }
		
		var originalSelectedIndex = OmnibarPlus.richlistbox.selectedIndex;
		var originalCurrentIndex = OmnibarPlus.richlistbox.currentIndex;
		OmnibarPlus.doIndexes();
		var nodes = [];
		
		// First we see what order the nodes should be in
		for(var type in OmnibarPlus.types) {
			nodes[OmnibarPlus.types[type]] = [];
		}
		
		for(var i=0; i<OmnibarPlus.richlist.length; i++) {
			var type = OmnibarPlus.getEntryType(OmnibarPlus.richlist[i].getAttribute('type'));
			nodes[OmnibarPlus.types[type]].push(OmnibarPlus.richlist[i]);
		}
		
		// Now we append all of them
		for(var type in OmnibarPlus.types) {
			for(var node in nodes[OmnibarPlus.types[type]]) {
				if(nodes[OmnibarPlus.types[type]][node].collapsed) {
					if(nodes[OmnibarPlus.types[type]][node].getAttribute('text') == gURLBar.value) {
						nodes[OmnibarPlus.types[type]][node].removeAttribute('collapsed');
						nodes[OmnibarPlus.types[type]][node] = OmnibarPlus.richlistbox.appendChild(nodes[OmnibarPlus.types[type]][node]);
					} else {
						// Remove collapsed entries so they're not triggered when hitting the up and down keys
						OmnibarPlus.richlistbox.removeChild(nodes[OmnibarPlus.types[type]][node]);
					}
				} else {
					nodes[OmnibarPlus.types[type]][node] = OmnibarPlus.richlistbox.appendChild(nodes[OmnibarPlus.types[type]][node]);
				}
			}
		}
		
		if(originalSelectedIndex >= 0 && (originalSelectedIndex >= OmnibarPlus.richlist.length || !OmnibarPlus.richlist[originalSelectedIndex]) ) {
			originalSelectedIndex = -1;
		}
		if(originalCurrentIndex >= 0 && (originalCurrentIndex >= OmnibarPlus.richlist.length || !OmnibarPlus.richlist[originalCurrentIndex]) ) {
			originalCurrentIndex = -1;
		}
		OmnibarPlus.doIndexes(originalSelectedIndex, originalCurrentIndex);
		
		// Speak words auto select first result compatibility
		if(originalSelectedIndex >= 0) {
			OmnibarPlus.overrideURL = OmnibarPlus.richlist[originalSelectedIndex].getAttribute('url');
		}
	},
	
	getEntryType: function(aType) {
		for(var type in OmnibarPlus.types) {
			if(OmnibarPlus.types[type] == 'EE') {
				var returnEE = type;
			}
			else if(aType.indexOf(OmnibarPlus.types[type]) > -1) {
				return type;
			}
		}
		return returnEE;
	},
	
	removeEntry: function(str) {
		for(var i=0; i<OmnibarPlus.types.length; i++) {
			if(OmnibarPlus.types[i] == str) {
				OmnibarPlus.types.splice(i, 1);
				return;
			}
		}
	},
	
	// Our takes on key navigation from gURLBar.onkeypress(event), if returns false, original onkeypress is called
	urlBarKeyDown: function(e) {
		// Sometimes the ontextentered attribute is reset (for some reason), this leads to double tabs being opened
		OmnibarPlus.checkOnHandlers();
		
		// Just discriminating using the same criteria the original onKeyPress does
		if (e.target.localName != "textbox") { return false; }
		
		var key = e.keyCode;
		if(key == e.DOM_VK_TAB && gURLBar.tabScrolling && gURLBar.popup.mPopupOpen) {
			key = (e.shiftKey) ? e.DOM_VK_UP : e.DOM_VK_DOWN;
		}
   		
   		switch(key) {
   			case e.DOM_VK_PAGE_UP:
   			case e.DOM_VK_PAGE_DOWN:
   			case e.DOM_VK_UP:
   			case e.DOM_VK_DOWN:
				// No point in doing anything if popup isn't open
				// Simply return default action
				if(!OmnibarPlus.panel.popupOpen) {
					return gURLBar._onKeyPress(e);
				}
		
				// Just discriminating using the same criteria the original onKeyPress does
				if (e.defaultPrevented || e.getPreventDefault()) { return false; } // can't put this before switch or enter won't be triggered
				if (gURLBar.disableKeyNavigation || e.ctrlKey || e.altKey) { return false; }
				
				var currentIndex = OmnibarPlus.richlistbox.currentIndex;
				switch(key) {
					case e.DOM_VK_PAGE_UP:
					case e.DOM_VK_UP:
						if(currentIndex > -1) {
							currentIndex = (key == e.DOM_VK_PAGE_UP) ? Math.max(currentIndex -5, -1) : currentIndex -1;
						} else {
							currentIndex = OmnibarPlus.richlist.length-1;
						}
						break;
					case e.DOM_VK_PAGE_DOWN:
					case e.DOM_VK_DOWN:
						if(currentIndex < OmnibarPlus.richlist.length-1) {
							currentIndex = (key == e.DOM_VK_PAGE_DOWN) ? Math.min(currentIndex +5, OmnibarPlus.richlist.length-1) : currentIndex +1;
						} else {
							currentIndex = -1;
						}
						break;
					default: break;
				}
				
				OmnibarPlus.doIndexes(currentIndex, currentIndex);
				
				if(currentIndex > -1 && OmnibarPlus.richlist[currentIndex] && OmnibarPlus.richlist[currentIndex].getAttribute('url')) {
					gURLBar.value = OmnibarPlus.richlist[currentIndex].getAttribute('url');
				} 
				else if(OmnibarPlus.richlist[0]) {
					gURLBar.value = OmnibarPlus.richlist[0].getAttribute('text');
				}
				OmnibarPlus.overrideURL = gURLBar.value;
				gURLBar.focus();
				
				return true;
			
			case e.DOM_VK_RETURN:
				OmnibarPlus.doIndexes();
				
				if(OmnibarPlus.overrideURL) {
					gURLBar.value = OmnibarPlus.overrideURL;
				}
				OmnibarPlus.overrideURL = null;
				
				e.okToProceed = true;
				return OmnibarPlus.fireOnSelect(e);
			
			default:
				var ret = gURLBar._onKeyPress(e);
				// Needs to be on a timer to correctly handle Ctrl+V (paste)
				// Otherwise the paste would occur after this
				OmnibarPlus.timerAid.init('key', function() { OmnibarPlus.overrideURL = gURLBar.value; }, 10);
				return ret;
		}
	},
	
	// Set urlbar ontextentered attribute to work with our handler
	checkOnHandlers: function() {
		if(gURLBar.getAttribute('ontextentered').indexOf('OmnibarPlus') < 0) {
			gURLBar._ontextentered = gURLBar.getAttribute('ontextentered');
			gURLBar.setAttribute('ontextentered', 'OmnibarPlus.fireOnSelect(param);');
		}
		if(OmnibarPlus.goButton.getAttribute('onclick').indexOf('OmnibarPlus') < 0) {
			OmnibarPlus.goButton._onclick = OmnibarPlus.goButton.getAttribute('onclick');
			OmnibarPlus.goButton.setAttribute('onclick', 'OmnibarPlus.onGoClick(event);'); 
		}	
	},
	
	fireOnSelect: function(e) {
		// We need the enter key to always call it from our handler or it won't work right sometimes
		if(e && e.type == 'keydown' && e.keyCode == e.DOM_VK_RETURN && !e.okToProceed) { return; }
		
		// We need to make sure the correct value is passed along
		if(OmnibarPlus.richlistbox.currentIndex != -1) {
			gURLBar.value = OmnibarPlus.richlist[OmnibarPlus.richlistbox.currentIndex].getAttribute('url');
		}
		
		gURLBar.blur();
		var opener = gBrowser.mCurrentBrowser;
		
		Omnibar._handleURLBarCommand(e);
		
		// Attempt to set the correct values in the urlbars of both the opened browser and the opening browser
		gURLBar.reset();
		gBrowser.mCurrentBrowser._userTypedValue = null;
		if(gBrowser.mCurrentBrowser != opener) {
			opener._userTypedValue = null;
		}
	},
	
	onGoClick: function(aEvent) {
		// This comes from TMP_goButtonClick() (from Tab Mix Plus), the original onclick is simply gURLBar.handleCommand()
		if(OmnibarPlus.goButton._onclick.indexOf('TMP') > -1 && aEvent.button == 1 && gURLBar.value == gBrowser.currentURI.spec) {
			gBrowser.duplicateTab(gBrowser.mCurrentTab);
		}
		else if(aEvent.button != 2) {
			OmnibarPlus.fireOnSelect(aEvent);
		}
	},
	
	// Make sure all the paste commands trigger our .overrideURL
	// Note that all the returns and checks are just prevention, I have no reason to put them here other than just making sure it works correctly
	fixContextMenu: function(organize) {
		if(gURLBar.inputBox) {
			var getFromHere = gURLBar.inputBox;
		} else {
			// Don't know exactly in which version of firefox .inputBox was removed, I just noticed it in 9.0a1
			var getFromHere = document.getAnonymousElementByAttribute(gURLBar, 'anonid', 'textbox-container').childNodes[0];
		}
		var contextMenu = document.getAnonymousElementByAttribute(getFromHere, 'anonid', 'input-box-contextmenu');
		if(!contextMenu) { return; }
		
		var undoItem = contextMenu.getElementsByAttribute('cmd', 'cmd_undo')[0];
		var cutItem = contextMenu.getElementsByAttribute('cmd', 'cmd_cut')[0];
		var pasteItem = contextMenu.getElementsByAttribute('cmd', 'cmd_paste')[0];
		var pasteAndGoItem = contextMenu.getElementsByAttribute('anonid', 'paste-and-go')[0];
		
		if(organize) {
			if(undoItem) {
				OmnibarPlus.listenerAid.add(undoItem, 'command', OmnibarPlus.paste, false);
			}
			if(cutItem) {
				OmnibarPlus.listenerAid.add(cutItem, 'command', OmnibarPlus.paste, false);
			}
			if(pasteItem) {
				OmnibarPlus.listenerAid.add(pasteItem, 'command', OmnibarPlus.paste, false);
			}
			if(pasteAndGoItem) {
				if(!pasteAndGoItem._oncommand) {
					pasteAndGoItem._oncommand = pasteAndGoItem.getAttribute('oncommand');
				}
				pasteAndGoItem.setAttribute('oncommand', 'OmnibarPlus.pasteAndGo(event);');
			}
		}
		else {
			if(undoItem) {
				OmnibarPlus.listenerAid.remove(undoItem, 'command', OmnibarPlus.paste, false);
			}
			if(cutItem) {
				OmnibarPlus.listenerAid.remove(cutItem, 'command', OmnibarPlus.paste, false);
			}
			if(pasteItem) {
				OmnibarPlus.listenerAid.remove(pasteItem, 'command', OmnibarPlus.paste, false);
			}
			if(pasteAndGoItem && pasteAndGoItem._oncommand) {
				pasteAndGoItem.setAttribute('oncommand', pasteAndGoItem._oncommand);
			}
		}
	},
	
	pasteAndGo: function(event) {
		gURLBar.select();
		goDoCommand('cmd_paste');
		OmnibarPlus.doIndexes();
		OmnibarPlus.fireOnSelect(event);
	},
	
	paste: function() {
		// Needs to be on a timer to correctly handle paste
		// Otherwise the paste would occur after this
		OmnibarPlus.timerAid.init('paste', function() { OmnibarPlus.overrideURL = gURLBar.value; }, 10);
	},	
		
	// Left click: default omnibar functionality; Middle Click: open the search engine homepage
	onEngineClick: function(event) {
		var modKey = (OmnibarPlus.OS == 'Darwin') ? event.metaKey : event.ctrlKey;
		
		if(event.button == 0 && !event.altKey && !modKey) {
			document.getElementById('omnibar-engine-menu').openPopup(Omnibar._imageElBox, "after_end", -1, -1);
			event.preventDefault();
			event.stopPropagation();
		}
		else if(event.button == 1
		|| (event.button == 0 && (event.altKey || modKey)) ) {
			OmnibarPlus.where = 'current';
			if(event.button == 1 || event.altKey || (Omnibar._prefSvc.getBoolPref("browser.search.openintab") && gBrowser.getBrowserForTab(gBrowser.selectedTab).currentURI.spec != "about:blank")) {
				OmnibarPlus.where = 'tab';
			}
			openUILinkIn(Omnibar._ss.currentEngine.searchForm, OmnibarPlus.where);
			
			event.preventDefault();
			event.stopPropagation();
		}
	}
}

Components.utils.import("chrome://omnibarplus/content/utils.jsm", OmnibarPlus);
OmnibarPlus.listenerAid.add(window, "load", OmnibarPlus.preinit, false);
