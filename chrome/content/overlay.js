var OmnibarPlus = {
	preinit: function() {
		OmnibarPlus.initTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		OmnibarPlus.initTimer.init(OmnibarPlus.init, 500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		window.removeEventListener("load", OmnibarPlus.preinit, false);
	},
	
	init: function() {
		if(typeof(Omnibar) == 'undefined') { return; }
		
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
		OmnibarPlus.types = [ 'EE', 'agrenon', 'smarterwiki', 'omnibar', 'collapsed' ]; 
		OmnibarPlus.organizing = false;
		OmnibarPlus.overrideURL = true;
		OmnibarPlus.fired = false;
		
		// Remove entries that aren't needed as to reduce the number of loops
		if(typeof(agrenonLoader) == 'undefined') { OmnibarPlus.removeEntry('agrenon'); }
		if(typeof(SmarterWiki) == 'undefined') { OmnibarPlus.removeEntry('smarterwiki'); }
		
		OmnibarPlus.engineName = document.getElementById('omnibar-defaultEngineName');
		OmnibarPlus.panel = document.getElementById('PopupAutoCompleteRichResult');
		OmnibarPlus.setWatchers(OmnibarPlus.panel);
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
			
			OmnibarPlus.originalOnTextEntered = gURLBar.getAttribute('ontextentered');
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
			
			for(var i=0; i<OmnibarPlus.richlist.length; i++) {
				if(OmnibarPlus.types[type] == 'EE') {
					if(OmnibarPlus.isSomethingElse(OmnibarPlus.richlist[i].getAttribute('type'), type)) {
						nodes[OmnibarPlus.types[type]].push(OmnibarPlus.richlist[i]);
						continue;
					}
				}
				else if(OmnibarPlus.types[type] == 'collapsed') {
					if(OmnibarPlus.richlist[i].collapsed) {
						nodes[OmnibarPlus.types[type]].push(OmnibarPlus.richlist[i]);
						continue;
					}
				}
				else {
					if(OmnibarPlus.richlist[i].getAttribute('type').indexOf(OmnibarPlus.types[type]) > -1) {
						nodes[OmnibarPlus.types[type]].push(OmnibarPlus.richlist[i]);
						continue;
					}	
				}
			}
		}
		
		// Now we append all of them
		for(var type in OmnibarPlus.types) {
			for(var node in nodes[OmnibarPlus.types[type]]) {
				OmnibarPlus.richlistbox.appendChild(nodes[OmnibarPlus.types[type]][node]);
			}
		}
		
		// Speak words auto select first result compatibility
		if(OmnibarPlus.panel._appendCurrentResult.toString().indexOf('orig.apply') > -1 && !gURLBar.willHandle) {
			OmnibarPlus.richlistbox.selectedIndex = 0;
		}
	},
	
	isSomethingElse: function(nodetype, type) {
		for(var j=type+1; j<OmnibarPlus.types.length; j++) {
			if(nodetype.indexOf(OmnibarPlus.types[j]) > -1 ) { return false; }
		}
		return true;
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
		
	removeEntry: function(str) {
		for(var i=0; i<OmnibarPlus.types.length; i++) {
			if(OmnibarPlus.types[i] == str) {
				OmnibarPlus.types.splice(i, 1);
				return;
			}
		}
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
	},
	
	// This acts as a replacement for the event DOM Attribute Modified, works for both attributes and object properties
	setWatchers: function(obj) {
		// Properties part, works by replacing the get and set accessor methods of a property with custom ones
		if(	typeof(obj) != 'object' 
			|| typeof(obj.addPropertyWatcher) != 'undefined'
			|| typeof(obj.removePropertyWatcher) != 'undefined'
			|| typeof(obj.propertiesWatched) != 'undefined') 
		{ 
			return; 
		}
		
		// Monitors 'prop' property of object, calling a handler function 'handler' when it is changed
		obj.addPropertyWatcher = function (prop, handler) {
			if(typeof(this.propertiesWatched[prop]) == 'undefined') {
				this.propertiesWatched[prop] = {};
				this.propertiesWatched[prop].handlers = new Array();
				this.propertiesWatched[prop].handlers.push(handler);
			
				this.propertiesWatched[prop].value = this[prop],
				getter = function () {
					return this.propertiesWatched[prop].value;
				},
				setter = function (newval) {
					for(var i=0; i<this.propertiesWatched[prop].handlers.length; i++) {
						this.propertiesWatched[prop].handlers[i].call(this, prop, this.propertiesWatched[prop].value, newval);
					}
					return this.propertiesWatched[prop].value = newval;
				};
				if (delete this[prop]) { // can't watch constants
					Object.defineProperty(this, prop, { get: getter, set: setter, enumerable: true, configurable: true });
				}
			}
			else {
				var add = true;
				for(var i=0; i<this.propertiesWatched[prop].handlers.length; i++) {
					// Have to compare using toSource(), it won't work if I just compare handlers for some reason
					if(this.propertiesWatched[prop].handlers[i].toSource() == handler.toSource()) {
						add = false;
					}
				}
				if(add) {
					this.propertiesWatched[prop].handlers.push(handler);
				}
			}
		};
		
		// Removes handler 'handler' for property 'prop'
		obj.removePropertyWatcher = function (prop, handler) {
			if(typeof(this.propertiesWatched[prop]) == 'undefined') { return; }
			
			for(var i=0; i<this.propertiesWatched[prop].handlers.length; i++) {
				if(this.propertiesWatched[prop].handlers[i].toSource() == handler.toSource()) {
					this.propertiesWatched[prop].handlers.splice(i, 1);
				}
			}
			
			if(this.propertiesWatched[prop].handlers.length == 0) {
				this.propertiesWatched[prop].value = this[prop];
				delete this[prop]; // remove accessors
				this[prop] = this.propertiesWatched[prop].value;
				delete this.propertiesWatched[prop];
			}
		};
		
		// This will hold the current value of all properties being monitored, as well as a list of their handlers to be called
		obj.propertiesWatched = {};
		
		// Attributes part, works by replacing the actual attribute native functions with custom ones (while still using the native ones)
		if(	typeof(obj.callAttributeWatchers) != 'undefined'
			|| typeof(obj.addAttributeWatcher) != 'undefined'
			|| typeof(obj.removeAttributeWatcher) != 'undefined'
			|| typeof(obj.attributesWatched) != 'undefined'
			|| typeof(obj.setAttribute) != 'function'
			|| typeof(obj.setAttributeNS) != 'function'
			|| typeof(obj.setAttributeNode) != 'function'
			|| typeof(obj.setAttributeNodeNS) != 'function'
			|| typeof(obj.removeAttribute) != 'function'
			|| typeof(obj.removeAttributeNS) != 'function'
			|| typeof(obj.removeAttributeNode) != 'function'
			|| typeof(obj.attributes.setNamedItem) != 'function'
			|| typeof(obj.attributes.setNamedItemNS) != 'function'
			|| typeof(obj.attributes.removeNamedItem) != 'function'
			|| typeof(obj.attributes.removeNamedItemNS) != 'function')
		{
			return;
		}
		
		// Monitors 'attr' attribute of element, calling a handler function 'handler' when it is set or removed
		obj.addAttributeWatcher = function (attr, handler) {
			if(typeof(this.attributesWatched[attr]) == 'undefined') {
				this.attributesWatched[attr] = {};
				this.attributesWatched[attr].handlers = new Array();
				this.attributesWatched[attr].handlers.push(handler);
			
				this.attributesWatched[attr].value = this.getAttribute(attr);
			}
			else {
				var add = true;
				for(var i=0; i<this.attributesWatched[attr].handlers.length; i++) {
					if(this.attributesWatched[attr].handlers[i].toSource() == handler.toSource()) {
						add = false;
					}
				}
				if(add) {
					this.attributesWatched[attr].handlers.push(handler);
				}
			}
		};
		
		// Removes handler function 'handler' for attribute 'attr'
		obj.removeAttributeWatcher = function (attr, handler) {
			if(typeof(this.attributesWatched[attr]) == 'undefined') { return; }
			
			for(var i=0; i<this.attributesWatched[attr].handlers.length; i++) {
				if(this.attributesWatched[attr].handlers[i].toSource() == handler.toSource()) {
					this.attributesWatched[attr].handlers.splice(i, 1);
				}
			}
		};
		
		// This will hold the current value of all attributes being monitored, as well as a list of their handlers to be called
		obj.attributesWatched = {};
		
		// Calls handler functions for attribute 'attr'
		obj.callAttributeWatchers = function (el, attr, newval) {
			if(typeof(el.attributesWatched[attr]) == 'undefined') { return; }
			
			el.attributesWatched[attr].value = newval;
			
			if(el.attributesWatched[attr].handlers.length == 0) { return; }
			for(var i=0; i<el.attributesWatched[attr].handlers.length; i++) {
				el.attributesWatched[attr].handlers[i].call(el, attr, el.attributesWatched[attr].value, newval);
			}
		};
		
		// Store all native functions as '_function' and set custom ones to handle attribute changes
		obj._setAttribute = obj.setAttribute;
		obj._setAttributeNS = obj.setAttributeNS;
		obj._setAttributeNode = obj.setAttributeNode;
		obj._setAttributeNodeNS = obj.setAttributeNodeNS;
		obj._removeAttribute = obj.removeAttribute;
		obj._removeAttributeNS = obj.removeAttributeNS;
		obj._removeAttributeNode = obj.removeAttributeNode;
		obj.attributes._setNamedItem = obj.attributes.setNamedItem;
		obj.attributes._setNamedItemNS = obj.attributes.setNamedItemNS;
		obj.attributes._removeNamedItem = obj.attributes.removeNamedItem;
		obj.attributes._removeNamedItemNS = obj.attributes.removeNamedItemNS;
		
		obj.setAttribute = function(attr, value) {
			this._setAttribute(attr, value);
			this.callAttributeWatchers(this, attr, value);
		};
		obj.setAttributeNS = function(namespace, attr, value) {
			this._setAttributeNS(namespace, attr, value);
			this.callAttributeWatchers(this, attr, value);
		};
		obj.setAttributeNode = function(attr) {
			var ret = this._setAttributeNode(attr);
			this.callAttributeWatchers(this, attr.name, attr.value);
			return ret;
		};
		obj.setAttributeNodeNS = function(attr) {
			var ret = this._setAttributeNodeNS(attr);
			this.callAttributeWatchers(this, attr.name, attr.value);
			return ret;
		};
		obj.removeAttribute = function(attr) {
			var callWatchers = (this.hasAttribute(attr)) ? true : false;
			this._removeAttribute(attr);
			if(callWatchers) {
				this.callAttributeWatchers(this, attr, null);
			}
		};
		obj.removeAttributeNS = function(namespace, attr) {
			var callWatchers = (this.hasAttribute(attr)) ? true : false;
			this._removeAttributeNS(namespace, attr);
			if(callWatchers) {
				this.callAttributeWatchers(this, attr, null);
			}
		};
		obj.removeAttributeNode = function(attr) {
			var callWatchers = (this.hasAttribute(attr.name)) ? true : false;
			var ret = this._removeAttributeNode(attr);
			if(callWatchers) {
				this.callAttributeWatchers(this, attr.name, null);
			}
			return ret;
		};
		obj.attributes.setNamedItem = function(attr) {
			var ret = this.attributes._setNamedItem(attr);
			this.callAttributeWatchers(this, attr.name, attr.value);
			return ret;
		};
		obj.attributes.setNamedItemNS = function(namespace, attr) {
			var ret = this.attributes._setNamedItemNS(namespace, attr);
			this.callAttributeWatchers(this, attr.name, attr.value);
			return ret;
		};
		obj.attributes.removeNamedItem = function(attr) {
			var callWatchers = (this.hasAttribute(attr)) ? true : false;
			var ret = this.attributes._removeNamedItem(attr);
			this.callAttributeWatchers(this, attr, null);
			return ret;
		};
		obj.attributes.removeNamedItemNS = function(namespace, attr) {
			var callWatchers = (this.hasAttribute(attr)) ? true : false;
			var ret = this.attributes._removeNamedItemNS(namespace, attr);
			this.callAttributeWatchers(this, attr, null);
			return ret;
		};
	}
}

window.addEventListener("load", OmnibarPlus.preinit, false);