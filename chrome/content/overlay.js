var OmnibarPlus = {
	preinit: function() {
		OmnibarPlus.timerAid.init('init', OmnibarPlus.init, 500);
		OmnibarPlus.listenerAid.remove(window, "load", OmnibarPlus.preinit, false);
	},
	
	init: function() {
		if(typeof(Omnibar) == 'undefined') { return; }
		
		OmnibarPlus.prefAid.init(OmnibarPlus, 'omnibarplus', ['f6', 'middleClick', 'organizePopup', 'animated', 'animatedScheme', 'engineFocus', 'agrenon', 'smarterwiki', 'organize1', 'organize2', 'organize3', 'organize4', 'autoSelect']);
		OmnibarPlus.prefAid.init(OmnibarPlus, 'omnibar', ['popupstyle']);
		
		OmnibarPlus.organizing = false;
		OmnibarPlus.willOrganize = false;
		OmnibarPlus.organized = false;
		OmnibarPlus.escaped = false;
		OmnibarPlus.selectedSuggestion = false;
		OmnibarPlus.LocationBarHelpers = (typeof(LocationBarHelpers) != 'undefined') ? true : false;
		
		// OS string
		OmnibarPlus.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		
		OmnibarPlus.goButton = document.getElementById('go-button');
		OmnibarPlus.engineName = document.getElementById('omnibar-defaultEngineName');
		OmnibarPlus.panel = document.getElementById('PopupAutoCompleteRichResult');
		OmnibarPlus.setWatchers(OmnibarPlus.engineName);
		
		OmnibarPlus.richlistbox = OmnibarPlus.panel.richlistbox;
		OmnibarPlus.richlist = OmnibarPlus.richlistbox.childNodes;
		gURLBar.OmnibarPlus = OmnibarPlus; // this actually helps
		
		OmnibarPlus.prefAid.listen('f6', OmnibarPlus.toggleF6);
		OmnibarPlus.prefAid.listen('middleClick', OmnibarPlus.toggleMiddleClick);
		OmnibarPlus.prefAid.listen('organizePopup', OmnibarPlus.toggleOrganize);
		OmnibarPlus.prefAid.listen('animated', OmnibarPlus.toggleAnimated);
		OmnibarPlus.prefAid.listen('animatedScheme', OmnibarPlus.toggleAnimated);
		OmnibarPlus.prefAid.listen('engineFocus', OmnibarPlus.toggleEngineFocus);
		OmnibarPlus.prefAid.listen('popupstyle', OmnibarPlus.toggleAnimated);
		OmnibarPlus.prefAid.listen('organize1', OmnibarPlus.getTypes);
		OmnibarPlus.prefAid.listen('organize2', OmnibarPlus.getTypes);
		OmnibarPlus.prefAid.listen('organize3', OmnibarPlus.getTypes);
		OmnibarPlus.prefAid.listen('organize4', OmnibarPlus.getTypes);
		
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
		if(OmnibarPlus.prefAid.middleClick) {
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
		// Compatibility with latest versions of firefox (aurora FF11 as far as I can tell doesn't have LocationBarHelpers anymore)
		// Setting these always, the switch On/Off are inside the functions themselves
		gURLBar.setAttribute('onsearchbegin', 'OmnibarPlus.searchBegin();');
		gURLBar.setAttribute('onsearchcomplete', 'OmnibarPlus.searchComplete();');
		
		if(OmnibarPlus.prefAid.organizePopup && !OmnibarPlus.organizing) {
			gURLBar._onKeyPress = gURLBar.onKeyPress;
			gURLBar.onKeyPress = function(aEvent) {
				return OmnibarPlus.urlBarKeyDown(aEvent);
			}
			
			OmnibarPlus.checkOnHandlers();
			OmnibarPlus.fixContextMenu(true);
			
			OmnibarPlus.richlistbox._appendChild = OmnibarPlus.richlistbox.appendChild;
			OmnibarPlus.richlistbox.appendChild = function(aNode) {
				if(OmnibarPlus.willOrganize) { OmnibarPlus.popupshowing(); }
				return OmnibarPlus.richlistbox._appendChild(aNode);
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
			OmnibarPlus.panel._onPopupClick = OmnibarPlus.panel.onPopupClick;
			OmnibarPlus.panel.onPopupClick = OmnibarPlus.modifyFunction(OmnibarPlus.panel.onPopupClick, [
				['if (aEvent.button == 2) {',
				<![CDATA[
				if (aEvent.button == 2) {
					if(this.richlistbox.currentItem) {
						this.input.value = this.richlistbox.currentItem.getAttribute('url') || this.richlistbox.currentItem.getAttribute('text');
					}
				]]>
				],
				['controller.handleEnter(true);',
				<![CDATA[
				this.input.OmnibarPlus.fireOnSelect(aEvent);
				]]>
				]
			]);
			
			OmnibarPlus.richlistbox._actualIndex = -1;
			OmnibarPlus.richlistbox.__defineGetter__("_actualItem", function() {
				if(this._actualIndex > -1 && this._actualIndex < this.childNodes.length) {
					return this.childNodes[this._actualIndex];
				}
				return null;
			});
			
			OmnibarPlus.organizing = true;
		} 
		else if(!OmnibarPlus.prefAid.organizePopup && OmnibarPlus.organizing) {
			gURLBar.onKeyPress = gURLBar._onKeyPress;
			
			// Changed in checkOnHandlers()
			gURLBar.setAttribute("ontextentered", gURLBar._ontextentered);
			OmnibarPlus.goButton.setAttribute('onclick', OmnibarPlus.goButton._onclick);
			
			OmnibarPlus.fixContextMenu(false);
			
			OmnibarPlus.richlistbox.appendChild = OmnibarPlus.richlistbox._appendChild;
			
			OmnibarPlus.panel.onPopupClick = OmnibarPlus.panel._onPopupClick;
			
			OmnibarPlus.organizing = false;
		}
	},
	
	// Toggle F6 functionality
	toggleF6: function() {
		if(OmnibarPlus.prefAid.f6) {
			document.getElementById('key_omnibarplus_f6').removeAttribute('disabled');
		} else {
			document.getElementById('key_omnibarplus_f6').setAttribute('disabled', 'true');
		}
	},
	
	// Toggle animated effects for the suggestion list
	toggleAnimated: function() {
		if(OmnibarPlus.prefAid.animated) {
			OmnibarPlus.panel.setAttribute('animatedPopup', OmnibarPlus.prefAid.animatedScheme);
		} else {
			OmnibarPlus.panel.removeAttribute('animatedPopup');
		}
	},
	
	// Toggles wether to focus the location bar when changing the search engine
	toggleEngineFocus: function() {
		if(OmnibarPlus.prefAid.engineFocus) {
			OmnibarPlus.engineName.addPropertyWatcher('value', openLocation);
		} else {
			OmnibarPlus.engineName.removePropertyWatcher('value', openLocation);
		}
	},
	
	// Called when a search begins and ends in the location bar
	searchBegin: function() {
		if(OmnibarPlus.prefAid.organizePopup) {
			OmnibarPlus.willOrganize = false;
			OmnibarPlus.organized = false;
			OmnibarPlus.selectedSuggestion = false;
			OmnibarPlus.escaped = false;
			OmnibarPlus.doIndexes();
		}
		if(OmnibarPlus.LocationBarHelpers) {
			LocationBarHelpers._searchBegin();
		}
	},
	searchComplete: function() {
		if(OmnibarPlus.prefAid.organizePopup) {
			OmnibarPlus.popupshowing();
		}
		if(OmnibarPlus.LocationBarHelpers) {
			LocationBarHelpers._searchComplete();
		}
	},
	
	// Handler for when the autocomplete pops up
	popupshowing: function() {
		if(OmnibarPlus.escaped) { return false; }
		OmnibarPlus.willOrganize = true;
		OmnibarPlus.timerAid.init('popupshowing', OmnibarPlus.organize, 100);
		return true;
	},
	
	// This method simply cleans the selection in the autocomplete popup
	doIndexes: function(selected, current) {
		if(selected == undefined) { var selected = -1; }
		if(current == undefined) { var current = -1; }
		
		OmnibarPlus.richlistbox.selectedIndex = selected;
		OmnibarPlus.richlistbox.currentIndex = current;
		OmnibarPlus.richlistbox._actualIndex = (current > -1) ? current : selected;
	},
	
	getTypes: function() {
		// entries are sorted in the order they appear in this list
		// 'agrenon' is for Peers extension entries
		// 'smarterwiki' is for FastestFox extension entries
		// 'omnibar' is for omnibar added search suggestions
		// 'EE' is for everything else; 
		OmnibarPlus.types = [
			OmnibarPlus.prefAid.organize1,
			OmnibarPlus.prefAid.organize2,
			OmnibarPlus.prefAid.organize3,
			OmnibarPlus.prefAid.organize4
		];
		
		// Remove entries that aren't needed as to reduce the number of loops
		if(typeof(agrenonLoader) == 'undefined') { 
			OmnibarPlus.removeEntry('agrenon');
			OmnibarPlus.prefAid.agrenon = false;
		} else {
			OmnibarPlus.prefAid.agrenon = true;
		}
		if(typeof(SmarterWiki) == 'undefined') { 
			OmnibarPlus.removeEntry('smarterwiki'); 
			OmnibarPlus.prefAid.smarterwiki = false;
		} else {
			OmnibarPlus.prefAid.smarterwiki = true;
		}
	},
	
	// Goes by each 'type' to be organized and organizes each entry of type 'type'
	organize: function() {
		if(!OmnibarPlus.panel.mPopupOpen) { return; }
		
		var originalSelectedIndex = OmnibarPlus.richlistbox.selectedIndex;
		var originalCurrentIndex = OmnibarPlus.richlistbox.currentIndex;
		OmnibarPlus.doIndexes();
		var nodes = [];
		
		// First we see what order the nodes should be in
		for(var type in OmnibarPlus.types) {
			nodes[OmnibarPlus.types[type]] = [];
		}
		
		for(var i=0; i<OmnibarPlus.richlist.length; i++) {
			OmnibarPlus.richlist[i].onmouseover = function() {
				OmnibarPlus.doIndexes(OmnibarPlus.richlistbox.selectedIndex, OmnibarPlus.richlistbox.currentIndex);
			}
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
		
		// Speak words auto select first result feature is overriden by ours
		if(originalSelectedIndex >= 0) {
			if(originalSelectedIndex >= OmnibarPlus.richlist.length || !OmnibarPlus.richlist[originalSelectedIndex]) {
				originalSelectedIndex = -1;
			}
			else if(!OmnibarPlus.prefAid.autoSelect && !OmnibarPlus.selectedSuggestion) {
				originalSelectedIndex = -1;
			}
		}
		if(originalSelectedIndex == -1 && OmnibarPlus.prefAid.autoSelect && OmnibarPlus.richlist.length > 0) {
			originalSelectedIndex = 0;
		}
		if(originalCurrentIndex >= 0) {
			if(originalCurrentIndex >= OmnibarPlus.richlist.length || !OmnibarPlus.richlist[originalCurrentIndex]) {
				originalCurrentIndex = -1;
			}
			else if(!OmnibarPlus.prefAid.autoSelect && !OmnibarPlus.selectedSuggestion) {
				originalCurrentIndex = -1;
			}
		}
		if(originalCurrentIndex == -1 && OmnibarPlus.prefAid.autoSelect && OmnibarPlus.richlist.length > 0) {
			originalCurrentIndex = 0;
		}
		OmnibarPlus.doIndexes(originalSelectedIndex, originalCurrentIndex);
		
		OmnibarPlus.organized = true;
		OmnibarPlus.panel.adjustHeight();
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
		var tab = false;
		if(key == e.DOM_VK_TAB && gURLBar.tabScrolling && OmnibarPlus.panel.mPopupOpen) {
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
				if(!OmnibarPlus.panel.mPopupOpen) {
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
				OmnibarPlus.selectedSuggestion = true;
				
				if(currentIndex > -1 && OmnibarPlus.richlist[currentIndex] && OmnibarPlus.richlist[currentIndex].getAttribute('url')) {
					gURLBar.value = OmnibarPlus.richlist[currentIndex].getAttribute('url');
				} 
				else if(OmnibarPlus.richlist[0]) {
					gURLBar.value = OmnibarPlus.richlist[0].getAttribute('text');
				}
				
				gURLBar.focus();
				
				// false makes sure it always places the cursor in the end
				return false;
			
			case e.DOM_VK_RETURN:
			case e.DOM_VK_ENTER:
				e.okToProceed = true;
				return OmnibarPlus.fireOnSelect(e);
			
			case e.DOM_VK_ESCAPE:
				OmnibarPlus.escaped = true;
				OmnibarPlus.doIndexes();
				return gURLBar._onKeyPress(e);
			
			case e.DOM_VK_DELETE:
				// Special actions for the del key (such as opening the clear history dialog) should still happen
				// If it's able to delete text from the url bar then do it
				if(e.ctrlKey || gURLBar.selectionStart != gURLBar.selectionEnd || gURLBar.selectionStart != gURLBar.textLength) {
					OmnibarPlus.doIndexes();
					return gURLBar._onKeyPress(e);
				}
				
				// For some reason, mPopupOpen and popupOpen aren't reliable in this case
				if(!OmnibarPlus.panel.mPopupOpen && OmnibarPlus.panel.state != 'open') {
					return gURLBar._onKeyPress(e);
				}
				
				// Delete entries from the popup list if applicable
				if(OmnibarPlus.richlistbox.currentItem) {
					var currentIndex = OmnibarPlus.richlistbox.currentIndex;
					var tempValue = OmnibarPlus.richlist[currentIndex].getAttribute('text');
					OmnibarPlus.richlistbox.removeChild(OmnibarPlus.richlistbox.currentItem);
					if(currentIndex == OmnibarPlus.richlist.length) {
						currentIndex--;
					}
					OmnibarPlus.doIndexes(currentIndex, currentIndex);
					OmnibarPlus.panel.adjustHeight();
					
					if(currentIndex > -1) {
						gURLBar.value = OmnibarPlus.richlist[currentIndex].getAttribute('url') || OmnibarPlus.richlist[currentIndex].getAttribute('text');
					} else {
						gURLBar.value = tempValue;
					}
					return true;
				}
				
				return gURLBar._onKeyPress(e);
							
			default:
				OmnibarPlus.doIndexes();
				return gURLBar._onKeyPress(e);
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
		
		if(OmnibarPlus.richlistbox.currentItem) {
			gURLBar.value = OmnibarPlus.richlistbox.currentItem.getAttribute('url');
		}
		else if(OmnibarPlus.richlistbox.selectedItem) {
			gURLBar.value = OmnibarPlus.richlistbox.selectedItem.getAttribute('url');
		}
		else if(OmnibarPlus.richlistbox._actualItem) {
			gURLBar.value = OmnibarPlus.richlistbox._actualItem.getAttribute('url');
		}
		OmnibarPlus.doIndexes();
				
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
			OmnibarPlus.doIndexes();
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
		OmnibarPlus.doIndexes();
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

OmnibarPlus.mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
OmnibarPlus.mozIJSSubScriptLoader.loadSubScript("chrome://omnibarplus/content/utils.jsm", OmnibarPlus);
OmnibarPlus.listenerAid.add(window, "load", OmnibarPlus.preinit, false);
