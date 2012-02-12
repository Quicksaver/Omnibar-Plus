// Checks if aNode decends from aParent
var hasAncestor = function(aNode, aParent, aWindow) {
	if(!aNode || !aParent) { return false; };
	
	if(aNode == aParent) { return true; }
	
	var ownDocument = aNode.ownerDocument || aNode.document;
	if(ownDocument && ownDocument == aParent) { return true; }
	if(aNode.compareDocumentPosition && (aNode.compareDocumentPosition(aParent) & aNode.DOCUMENT_POSITION_CONTAINS)) { return true; }
	
	var browsers = aParent.getElementsByTagName('browser');
	for(var i=0; i<browsers.length; i++) {
		if(hasAncestor(aNode, browsers[i].contentDocument, browsers[i].contentWindow)) { return true; }
	}
	
	if(!aWindow) { return false; }
	for(var i=0; i<aWindow.frames.length; i++) {
		if(hasAncestor(aNode, aWindow.frames[i].document, aWindow.frames[i])) { return true; }
	}
	return false;
};

// in theory this should collapse whatever I want
var hideIt = function(aNode, show) {
	if(!show) {
		aNode.setAttribute('collapsed', 'true');
	} else {
		aNode.removeAttribute('collapsed');
	}
};

// allows me to modify a function quickly from within my scripts
// Note to self, this returns anonymous functions, make sure this doesn't become an issue when modifying certain functions
var modifyFunction = function(aOriginal, aArray) {
	var newCode = aOriginal.toString();
	for(var i=0; i < aArray.length; i++) {
		newCode = newCode.replace(aArray[i][0], aArray[i][1]);
	}
	
	var listArguments = newCode.substring(newCode.indexOf('(')+1, newCode.indexOf(')'));
	var arrayArguments = (listArguments == '') ? [] : listArguments.split(', ');
	// trim whitespaces from arguments if for some reason they exist
	for(var e=0; e < arrayArguments.length; e++) {
		arrayArguments[e] = arrayArguments[e].replace(/^\s*([\S\s]*?)\s*$/, '$1');
	}
	
	newCode = newCode.substring(newCode.indexOf('{')+1, newCode.lastIndexOf('}'));
	
	var ret = new Function(arrayArguments, newCode);
	return ret;
};

// This acts as a replacement for the event DOM Attribute Modified, works for both attributes and object properties
var setWatchers = function(obj) {
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
		
			this.propertiesWatched[prop].value = this[prop];
			
			if (delete this[prop]) { // can't watch constants
				this.__defineGetter__(prop, function () { return this.propertiesWatched[prop].value; });
				this.__defineSetter__(prop, function (newval) {	
					for(var i=0; i<this.propertiesWatched[prop].handlers.length; i++) {
						try { this.propertiesWatched[prop].handlers[i].call(this, prop, this.propertiesWatched[prop].value, newval); }
						catch(ex) {
							var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
							consoleService.logStringMessage(ex);
						}
					}
					return this.propertiesWatched[prop].value = newval;
				});
			};
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
		
		for(var i=0; i<el.attributesWatched[attr].handlers.length; i++) {
			try { el.attributesWatched[attr].handlers[i].call(el, attr, el.attributesWatched[attr].value, newval); }
			catch(ex) {
				var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
				consoleService.logStringMessage(ex);
			}
		}
		
		el.attributesWatched[attr].value = newval;
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
};

// Object to aid in setting and removing all kind of listeners
var listenerAid = {
	handlers: new Array(),
	modifyFunction: this.modifyFunction,
	
	add: function(obj, type, listener, capture, maxTriggers) {
		if(obj.addEventListener) {
			for(var i=0; i<this.handlers.length; i++) {
				if(this.handlers[i].obj == obj && this.handlers[i].type == type && this.handlers[i].capture == capture && this.compareListener(this.handlers[i].listener, listener)) {
					return false;
				}
			}
			
			if(maxTriggers === true) {
				maxTriggers = 1;
			}
			
			if(maxTriggers) {
				listener = this.modifyListener(listener);
			}
			
			var newHandler = {
				obj: obj,
				type: type,
				listener: listener,
				capture: capture,
				maxTriggers: null,
				triggerCount: null,
				aid: null
			};
			this.handlers.push(newHandler);
			var i = this.handlers.length -1;
			if(maxTriggers) {
				this.handlers[i].triggerCount = 0;
				this.handlers[i].maxTriggers = maxTriggers;
				this.handlers[i].aid = this;
				if(!obj._listenerAidHandlers) {
					obj._listenerAidHandlers = [];
				}
				obj._listenerAidHandlers.push(this.handlers[i]);
			}
			
			this.handlers[i].obj.addEventListener(this.handlers[i].type, this.handlers[i].listener, this.handlers[i].capture);
		}
		else if(obj.events && obj.events.addListener) {
			for(var i=0; i<this.handlers.length; i++) {
				if(this.handlers[i].obj == obj && this.handlers[i].type == type && this.compareListener(this.handlers[i].listener, listener)) {
					return false;
				}
			}
			
			var newHandler = {
				obj: obj,
				type: type,
				listener: listener
			};
			this.handlers.push(newHandler);
			var i = this.handlers.length -1;
			this.handlers[i].obj.events.addListener(this.handlers[i].type, this.handlers[i].listener);
		}
		
		return true;
	},
	
	remove: function(obj, type, listener, capture, maxTriggers) {
		if(obj.removeEventListener) {
			if(maxTriggers) {
				listener = this.modifyListener(listener);
			}
			
			for(var i=0; i<this.handlers.length; i++) {
				if(this.handlers[i].obj == obj && this.handlers[i].type == type && this.handlers[i].capture == capture && this.compareListener(this.handlers[i].listener, listener)) {
					this.handlers[i].obj.removeEventListener(this.handlers[i].type, this.handlers[i].listener, this.handlers[i].capture);
					this.handlers.splice(i, 1);
					return true;
				}
			}
		}
		else if(obj.events && obj.events.removeListener) {
			for(var i=0; i<this.handlers.length; i++) {
				if(this.handlers[i].obj == obj && this.handlers[i].type == type && this.compareListener(this.handlers[i].listener, listener)) {
					this.handlers[i].obj.events.removeListener(this.handlers[i].type, this.handlers[i].listener);
					this.handlers.splice(i, 1);
					return true;
				}
			}
		}
		
		return false;
	},
	
	clean: function() {
		for(var i=0; i<this.handlers.length; i++) {
			if(this.handlers[i].obj) {
				if(this.handlers[i].obj.removeEventListener) {
					this.handlers[i].obj.removeEventListener(this.handlers[i].type, this.handlers[i].listener, this.handlers[i].capture);
				}
				else if(this.handlers[i].obj.events && this.handlers[i].obj.events.removeListener) {
					this.handlers[i].obj.events.removeListener(this.handlers[i].type, this.handlers[i].listener);
				}
			}
		}
		return true;
	},
	
	compareListener: function(a, b) {
		if(a == b || a.toSource() == b.toSource()) {
			return true;
		}
		return false;
	},
	
	modifyListener: function(listener) {
		var newListener = this.modifyFunction(listener, [
			['{',
			<![CDATA[
			{
				var targets = ['target', 'originalTarget', 'currentTarget'];
				if(typeof(event) != 'undefined') {
					var e = event;
				} else if(typeof(e) == 'undefined') {
					var e = arguments[0];
				}
				
				mainRemoveListenerLoop:
				for(var a = 0; a < targets.length; a++) {
					if(!e[targets[a]] || !e[targets[a]]._listenerAidHandlers) {
						continue;
					}
					
					for(var i = 0; i < e[targets[a]]._listenerAidHandlers.length; i++) {
						if(e[targets[a]]._listenerAidHandlers[i].obj == e[targets[a]] // supposedly this would always return true?
						&& e[targets[a]]._listenerAidHandlers[i].type == e.type
							&& ((e[targets[a]]._listenerAidHandlers[i].capture && e.eventPhase == e.CAPTURING_PHASE)
							|| (!e[targets[a]]._listenerAidHandlers[i].capture && e.eventPhase != e.CAPTURING_PHASE))
						&& e[targets[a]]._listenerAidHandlers[i].aid.compareListener(e[targets[a]]._listenerAidHandlers[i].listener, arguments.callee)) {
							e[targets[a]]._listenerAidHandlers[i].triggerCount++;
							if(e[targets[a]]._listenerAidHandlers[i].triggerCount == e[targets[a]]._listenerAidHandlers[i].maxTriggers) {
								e[targets[a]]._listenerAidHandlers[i].aid.remove(e[targets[a]], e[targets[a]]._listenerAidHandlers[i].type, e[targets[a]]._listenerAidHandlers[i].listener, e[targets[a]]._listenerAidHandlers[i].capture);
								e[targets[a]]._listenerAidHandlers.splice(i, 1);
								break mainRemoveListenerLoop;
							}
						}
					}
				}
			]]>
			],
			
			// This is just so my editor correctly assumes the pairs of {}, it has nothing to do with the add-on itself
			['}',
			<![CDATA[
			}
			]]>
			]
		]);
		return newListener;
	}
};

// this lets me run functions asyncronously, basically it's a one shot timer with a delay of 0msec
var aSync = function(aFunc, aName) {
	if(!aName) {
		var timerObj = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		timerObj.init(aFunc, 0, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
	} else {
		this.timerAid.init(aName, aFunc, 0);
	}
	return true;
}

// Object to aid in setting, initializing and cancelling timers
var timerAid = {
	_timers: {},
	
	init: function(aName, aFunc, aDelay, aType) {
		this.cancel(aName);
		
		var type = this._switchType(aType);
		var self = this;
		this._timers[aName] = {
			object: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),
			handler: aFunc
		};
		if(type == Components.interfaces.nsITimer.TYPE_ONE_SHOT) {
			this._timers[aName].object.init(function(aSubject, aTopic, aData) {
				self._timers[aName].handler(aSubject, aTopic, aData);
				self.cancel(aName);
			}, aDelay, type);
		}
		else {
			this._timers[aName].object.init(this._timers[aName].handler, aDelay, type);
		}
		this.__defineGetter__(aName, function() { return this._timers[aName]; });
	},
	
	cancel: function(name) {
		if(this._timers[name]) {
			this._timers[name].object.cancel();
			this._timers[name] = null;
			return true;
		}
		return false;
	},
	
	create: function() {
		var newTimer = {};
		newTimer.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		newTimer._switchType = this._switchType;
		newTimer.init = function(aFunc, aDelay, aType) {
			var type = this._switchType(aType);
			this.timer.init(aFunc, aDelay, type);
		}
		newTimer.cancel = function() {
			this.timer.cancel();
		}
		return newTimer;
	},
			
	_switchType: function(type) {
		switch(type) {
			case 'slack':
				return Components.interfaces.nsITimer.TYPE_REPEATING_SLACK;
				break;
			case 'precise':
				return Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE;
				break;
			case 'precise_skip':
				return Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE_CAN_SKIP;
				break;
			case 'once':
			default:
				return Components.interfaces.nsITimer.TYPE_ONE_SHOT;
				break;
		}
		
		return false;
	}
};

var prefAid = {
	_prefObjects: {},
	_listenerAid: this.listenerAid,
	length: 0,
	
	init: function(branch, prefList) {
		var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
		
		for(var i=0; i<prefList.length; i++) {
			this._prefObjects[prefList[i]] = Application.prefs.get('extensions.'+branch+'.' + prefList[i]);
			this._setPref(prefList[i]);
		}
	},
	
	_setPref: function(pref) {
		this.__defineGetter__(pref, function() { return this._prefObjects[pref].value; });
		this.__defineSetter__(pref, function(v) { return this._prefObjects[pref].value = v; });
		this.length++;
	},
	
	listen: function(pref, handler) {
		this._listenerAid.add(this._prefObjects[pref], "change", handler);
	},
	
	unlisten: function(pref, handler) {
		this._listenerAid.remove(this._prefObjects[pref], "change", handler);
	},
	
	reset: function(pref) {
		this._prefObjects[pref].reset();
	}
};

// Private browsing mode listener as on https://developer.mozilla.org/En/Supporting_private_browsing_mode, with a few modifications
var PrivateBrowsingListener = {
	OS: null,
	autoStarted: false,
	inPrivateBrowsing: false, // whether we are in private browsing mode
	watcher: null, // the watcher object
	
	init: function(aWatcher) {
		this.watcher = aWatcher;
		
		this.OS = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		this.OS.addObserver(this, "private-browsing", false);
		this.OS.addObserver(this, "quit-application", false);
		
		var pbs = Components.classes["@mozilla.org/privatebrowsing;1"].getService(Components.interfaces.nsIPrivateBrowsingService);
		this.inPrivateBrowsing = pbs.privateBrowsingEnabled;
		this.autoStarted = pbs.autoStarted;
		if(this.autoStarted && this.watcher && "autoStarted" in this.watcher) {
			this.watcher.autoStarted();
		}
	},
	
	observe: function(aSubject, aTopic, aData) {
		if(aTopic == "private-browsing") {
			if(aData == "enter") {
				this.inPrivateBrowsing = true;
				if(this.watcher && "onEnter" in this.watcher) {
					this.watcher.onEnter();
				}
			} else if(aData == "exit") {
				this.inPrivateBrowsing = false;
				if(this.watcher && "onExit" in this.watcher) {
					this.watcher.onExit();
				}
			}
		} else if(aTopic == "quit-application") {
			this.OS.removeObserver(this, "quit-application");
			this.OS.removeObserver(this, "private-browsing");
			if(this.watcher && "onQuit" in this.watcher) {
				this.watcher.onQuit();
			}
		}
	}
};
