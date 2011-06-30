var OmnibarPlus = {
	preinit: function() {
		OmnibarPlus.initTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		OmnibarPlus.initTimer.init(OmnibarPlus.init, 500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		window.removeEventListener("load", OmnibarPlus.preinit, false);
	},
	
	init: function() {
		if(typeof(Omnibar) == 'undefined') { return; }
		
		Components.utils.import("chrome://omnibarplus/content/setWatchers.jsm", OmnibarPlus);
		
		OmnibarPlus.F6 = Application.prefs.get("extensions.omnibarplus.f6");
		OmnibarPlus.middleClick = Application.prefs.get("extensions.omnibarplus.middleClick");
		OmnibarPlus.organizePopup = Application.prefs.get("extensions.omnibarplus.organizePopup");
		OmnibarPlus.animated = Application.prefs.get("extensions.omnibarplus.animated");
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
		
		// OS string
		OmnibarPlus.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		
		OmnibarPlus.goButton = document.getElementById('go-button');
		OmnibarPlus.engineName = document.getElementById('omnibar-defaultEngineName');
		OmnibarPlus.panel = document.getElementById('PopupAutoCompleteRichResult');
		OmnibarPlus.setWatchers(OmnibarPlus.engineName);
		
		OmnibarPlus.urlbar = document.getElementById('urlbar');
		OmnibarPlus.richlistbox = OmnibarPlus.panel.richlistbox;
		OmnibarPlus.richlist = OmnibarPlus.richlistbox.childNodes;
		
		OmnibarPlus.F6.events.addListener("change", OmnibarPlus.toggleF6);
		OmnibarPlus.middleClick.events.addListener("change", OmnibarPlus.toggleMiddleClick);
		OmnibarPlus.organizePopup.events.addListener("change", OmnibarPlus.toggleOrganize);
		OmnibarPlus.animated.events.addListener("change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.engineFocus.events.addListener("change", OmnibarPlus.toggleEngineFocus);
		OmnibarPlus.popupStyle.events.addListener("change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.organizeList.organize1.events.addListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize2.events.addListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize3.events.addListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize4.events.addListener("change", OmnibarPlus.getTypes);
		
		// Grab types of entries to populate the organize list
		// Also sets whether Peers/FastestFox is enabled
		OmnibarPlus.getTypes();
		
		OmnibarPlus.toggleF6();
		OmnibarPlus.toggleMiddleClick();		
		OmnibarPlus.toggleOrganize();
		OmnibarPlus.toggleAnimated();
		OmnibarPlus.toggleEngineFocus();
		
		window.addEventListener("unload", OmnibarPlus.deinit, false);
	},
	
	deinit: function() {
		OmnibarPlus.F6.events.removeListener("change", OmnibarPlus.toggleF6);
		OmnibarPlus.middleClick.events.removeListener("change", OmnibarPlus.toggleMiddleClick);
		OmnibarPlus.organizePopup.events.removeListener("change", OmnibarPlus.toggleOrganize);
		OmnibarPlus.animated.events.removeListener("change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.engineFocus.events.removeListener("change", OmnibarPlus.toggleEngineFocus);
		OmnibarPlus.popupStyle.events.removeListener("change", OmnibarPlus.toggleAnimated);
		OmnibarPlus.organizeList.organize1.events.removeListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize2.events.removeListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize3.events.removeListener("change", OmnibarPlus.getTypes);
		OmnibarPlus.organizeList.organize4.events.removeListener("change", OmnibarPlus.getTypes);
	},
	
	// Toggle middle click functionality
	toggleMiddleClick: function() {
		document.getElementById('omnibar-in-urlbar').removeAttribute('onclick'); // We need to remove this first
		if(OmnibarPlus.middleClick.value) {
			document.getElementById('omnibar-in-urlbar').removeEventListener('click', Omnibar.onButtonClick, false);
			document.getElementById('omnibar-in-urlbar').addEventListener('click', OmnibarPlus.onEngineClick, false);
		}
		else {
			document.getElementById('omnibar-in-urlbar').removeEventListener('click', OmnibarPlus.onEngineClick, false); 
			document.getElementById('omnibar-in-urlbar').addEventListener('click', Omnibar.onButtonClick, false);
		}
	},
	
	// Toggle Organize Functionality, we'll use a delay to let the popup fill up before organizing it
	toggleOrganize: function() {
		if(OmnibarPlus.organizePopup.value && !OmnibarPlus.organizing) {
			gURLBar._onKeyPress = gURLBar.onKeyPress;
			gURLBar.onKeyPress = function(aEvent) {
				return OmnibarPlus.urlBarKeyDown(aEvent);
			}
			
			OmnibarPlus.checkOnHandlers();
			
			LocationBarHelpers.__searchComplete = LocationBarHelpers._searchComplete;	
			LocationBarHelpers._searchComplete = function() {
				OmnibarPlus.popupshowing();
				LocationBarHelpers.__searchComplete();
			};
			
			gURLBar._appendChild = gURLBar.appendChild;
			gURLBar.appendChild = function(aNode) {
				OmnibarPlus.popupshowing();
				return gURLBar._appendChild(aNode);
			}
			
			OmnibarPlus.organizing = true;
		} 
		else if(!OmnibarPlus.organizePopup.value && OmnibarPlus.organizing) {
			gURLBar.onKeyPress = gURLBar._onKeyPress;
			
			// Changed in checkOnHandlers()
			gURLBar.setAttribute("ontextentered", gURLBar._ontextentered);
			OmnibarPlus.goButton.setAttribute('onclick', OmnibarPlus.goButton._onclick);
			
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
			OmnibarPlus.panel.setAttribute('animatedPopup', 'true');
		} else {
			OmnibarPlus.panel.removeAttribute('animatedPopup');
		}
	},
	
	// Toggles wether to focus the location bar when changing the search engine
	toggleEngineFocus: function() {
		if(OmnibarPlus.engineFocus.value) {
			OmnibarPlus.engineName.addPropertyWatcher('value', openLocation);
		} else {
			OmnibarPlus.engineName.removePropertyWatcher('value');
		}
	},
	
	// Handler for when the autocomplete pops up
	popupshowing: function() {
		OmnibarPlus.popupshowingTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		OmnibarPlus.popupshowingTimer.init(OmnibarPlus.organize, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		return true;
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
		
		var originalSelectedIndex = OmnibarPlus.richlistbox.selectIndex;
		var originalCurrentIndex = OmnibarPlus.richlistbox.currentIndex;
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
					// Remove collapsed entries so they're not triggered when hitting the up and down keys
					OmnibarPlus.richlistbox.removeChild(nodes[OmnibarPlus.types[type]][node]);
				} else {
					nodes[OmnibarPlus.types[type]][node] = OmnibarPlus.richlistbox.appendChild(nodes[OmnibarPlus.types[type]][node]);
				}
			}
		}
		
		// Speak words auto select first result compatibility
		if(OmnibarPlus.panel._appendCurrentResult.toString().indexOf('orig.apply') > -1 && !gURLBar.willHandle) {
			if(!OmnibarPlus.richlist[originalSelectedIndex]) {
				originalSelectedIndex = 0;
			}
			if(!OmnibarPlus.richlist[originalCurrentIndex]) {
				originalCurrentIndex = 0;
			}
			OmnibarPlus.richlistbox.selectedIndex = originalSelectedIndex;
			OmnibarPlus.richlistbox.currentIndex = originalCurrentIndex;
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
		if(key == e.DOM_VK_TAB && this.tabScrolling && this.popup.mPopupOpen) {
			key = (e.shiftKey) ? e.DOM_VK_UP : e.DOM_VK_DOWN;
		}
   		
   		switch(key) {
   			case e.DOM_VK_PAGE_UP:
   			case e.DOM_VK_PAGE_DOWN:
   			case e.DOM_VK_UP:
   			case e.DOM_VK_DOWN:
				// No point in doing anything if popup isn't open
				if(!OmnibarPlus.panel.popupOpen) { return false; }
		
				// Just discriminating using the same criteria the original onKeyPress does
				if (e.defaultPrevented || e.getPreventDefault()) { return false; } // can't put this before switch or enter won't be triggered
				if (this.disableKeyNavigation || e.ctrlKey || e.altKey) { return false; }
				
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
				
				OmnibarPlus.richlistbox.currentIndex = currentIndex;
				OmnibarPlus.richlistbox.selectedIndex = currentIndex;
				
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
				OmnibarPlus.richlistbox.currentIndex = -1;
				if(OmnibarPlus.overrideURL) {
					gURLBar.value = OmnibarPlus.overrideURL;
					OmnibarPlus.overrideURL = null;
				}
				e.okToProceed = true;
				return OmnibarPlus.fireOnSelect(e);
			
			default: 
				var ret = gURLBar._onKeyPress(e);
				OmnibarPlus.overrideURL = gURLBar.value;
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
	
	fireOnSelect: function(param) {
		// We need the enter key to always call it from our handler or it won't work right sometimes
		if(param && param.type == 'keydown' && param.keyCode == param.DOM_VK_RETURN && !param.okToProceed) { return; }
		
		// We need to make sure the correct value is passed along
		if(OmnibarPlus.richlistbox.currentIndex != -1) {
			gURLBar.value = OmnibarPlus.richlist[OmnibarPlus.richlistbox.currentIndex].getAttribute('url');
		}
		
		gURLBar.blur();
		Omnibar._handleURLBarCommand(param);
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

window.addEventListener("load", OmnibarPlus.preinit, false);