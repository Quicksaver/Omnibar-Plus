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
		
		// entries are sorted in the order they appear in this list
		// 'agrenon' is for Peers extension entries
		// 'smarterwiki' is for FastestFox extension entries
		// 'omnibar' is for omnibar added search suggestions
		// 'EE' is for everything else; 
		// 'collapsed' is for elements that are collapsed, they are better positioned at the end of the list
		OmnibarPlus.types = [ 'EE', 'agrenon', 'smarterwiki', 'omnibar' ]; 
		OmnibarPlus.organizing = false;
		OmnibarPlus.overrideURL = true;
		OmnibarPlus.fired = false;
		
		// Remove entries that aren't needed as to reduce the number of loops
		if(typeof(agrenonLoader) == 'undefined') { OmnibarPlus.removeEntry('agrenon'); }
		if(typeof(SmarterWiki) == 'undefined') { OmnibarPlus.removeEntry('smarterwiki'); }
		
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
		
		if(OmnibarPlus.organizing) {
			gURLBar.removeEventListener('keydown', OmnibarPlus.urlBarKeyDown, true);
		}
	},
	
	// Toggle middle click functionality
	toggleMiddleClick: function() {
		document.getElementById('omnibar-in-urlbar').removeAttribute('onclick'); // We need to remove this first
		if(OmnibarPlus.middleClick.value) {
			document.getElementById('omnibar-in-urlbar').removeEventListener('click', Omnibar.onButtonClick, false);
			document.getElementById('omnibar-in-urlbar').addEventListener('click', OmnibarPlus.onButtonClick, false);
		}
		else {
			document.getElementById('omnibar-in-urlbar').removeEventListener('click', OmnibarPlus.onButtonClick, false); 
			document.getElementById('omnibar-in-urlbar').addEventListener('click', Omnibar.onButtonClick, false);
		}
	},
	
	// Toggle Organize Functionality, we'll use a delay to let the popup fill up before organizing it
	toggleOrganize: function() {
		if(OmnibarPlus.organizePopup.value) {
			gURLBar.addEventListener('keydown', OmnibarPlus.urlBarKeyDown, true);
			OmnibarPlus.setWatchers(gURLBar);
			
			OmnibarPlus.checkOnTextEntered();
			
			LocationBarHelpers.__searchComplete = LocationBarHelpers._searchComplete;	
			LocationBarHelpers._searchComplete = function() {
				OmnibarPlus.popupshowing();
				LocationBarHelpers.__searchComplete();
			};
			
			OmnibarPlus.organizing = true;
		} 
		else if(OmnibarPlus.organizing) {
			gURLBar.removeEventListener('keydown', OmnibarPlus.urlBarKeyDown, true);
			gURLBar.setAttribute("ontextentered", OmnibarPlus.originalOnTextEntered);
			
			LocationBarHelpers._searchComplete = LocationBarHelpers.__searchComplete;
			
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
	
	// Set urlbar ontextentered attribute to work with our handler
	checkOnTextEntered: function() {
		if(gURLBar.getAttribute('ontextentered').indexOf('OmnibarPlus') < 0) {
			OmnibarPlus.originalOnTextEntered = gURLBar.getAttribute('ontextentered');
			gURLBar.setAttribute('ontextentered', 'OmnibarPlus.fireOnSelect();');
		}
	},
	
	// Handler for when the autocomplete pops up
	popupshowing: function() {
		OmnibarPlus.popupshowingTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		OmnibarPlus.popupshowingTimer.init(OmnibarPlus.organize, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		return true;
	},
	
	// Goes by each 'type' to be organized and organizes each entry of type 'type'
	organize: function() {
		if(!OmnibarPlus.panel.popupOpen) { return; }
		
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
			OmnibarPlus.richlistbox.selectedIndex = 0;
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
	
	urlBarKeyDown: function(e) {
		switch(e.keyCode) {
			// Some times the list is unresponsive when using PageUp or PageDown after organizing, so I'm disabling them altogether
			case e.DOM_VK_PAGE_UP:
			case e.DOM_VK_PAGE_DOWN:
				e.preventDefault();
				e.stopPropagation();
				return false;
				break;
			
			case e.DOM_VK_UP:
			case e.DOM_VK_DOWN:
				if(!OmnibarPlus.panel.popupOpen) { return; }
				
				var currentIndex = OmnibarPlus.richlistbox.currentIndex;
				switch(e.keyCode) {
					case e.DOM_VK_UP:
						currentIndex--;
						break;
					case e.DOM_VK_DOWN:
						currentIndex++;
						break;
					default: break;
				}
				
				if(currentIndex == -1 
				|| typeof(OmnibarPlus.richlist[currentIndex]) == 'undefined'
				|| OmnibarPlus.richlist[currentIndex].collapsed) { return; }
				
				OmnibarPlus.currentURL = OmnibarPlus.richlist[currentIndex].getAttribute('url');
				
				gURLBar.addPropertyWatcher('value', function() {
					if(gURLBar.value != OmnibarPlus.currentURL) {
						gURLBar.removePropertyWatcher('value', arguments.callee);
						gURLBar.value = OmnibarPlus.currentURL;
					}
				});
						
				OmnibarPlus.overrideURL = true;
				return;
			
			case e.DOM_VK_RETURN:
				// Sometimes the ontextentered attribute is reset (for some reason), this leads to double tabs being opened
				OmnibarPlus.checkOnTextEntered();
				
				OmnibarPlus.overrideURL = false;
				
				// Peers compatibility (hitting enter not firing a search sometimes)
				OmnibarPlus.fireOnSelect(null);
				e.preventDefault();
				e.stopPropagation();
				return;
				
			default:
				// Sometimes the ontextentered attribute is reset (for some reason), this leads to double tabs being opened
				OmnibarPlus.checkOnTextEntered();
				
				OmnibarPlus.overrideURL = true;
				return;
		}
	},
	
	fireOnSelect: function(param) {
		// Peers compatibility (hitting enter not firing a search sometimes)
		if(OmnibarPlus.fired) { return; }
		OmnibarPlus.fired = true;
		OmnibarPlus.firedTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		OmnibarPlus.firedTimer.init(function() { OmnibarPlus.fired = false; }, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		
		if(OmnibarPlus.overrideURL && OmnibarPlus.richlistbox.currentIndex != -1) {
			gURLBar.value = OmnibarPlus.richlist[OmnibarPlus.richlistbox.currentIndex].getAttribute('url');
		}
		gURLBar.blur();
		Omnibar._handleURLBarCommand(param);
		gURLBar.reset();
	},
		
	// Left click: default omnibar functionality; Middle Click: open the search engine homepage
	onButtonClick: function (event) {
		if(event.button == 0 && !event.altKey && !event.ctrlKey) {
			document.getElementById('omnibar-engine-menu').openPopup(Omnibar._imageElBox, "after_end", -1, -1);
			event.preventDefault();
			event.stopPropagation();
		}
		else if(event.button == 1
		|| (event.button == 0 && (event.altKey || event.ctrlKey)) ) {
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