moduleAid.VERSION = '2.0.7';
moduleAid.LAZY = true;

// window - Similarly to windowMediator.callOnMostRecent, the window property returns the most recent navigator:browser window object
this.__defineGetter__('window', function() { return Services.wm.getMostRecentWindow('navigator:browser'); });

// document - Returns the document object associated with the most recent window object
this.__defineGetter__('document', function() { return window.document; });

// prefAid - Object to contain and manage all preferences related to the add-on (and others if necessary)
this.__defineGetter__('prefAid', function() { delete this.prefAid; moduleAid.load('utils/prefAid'); return prefAid; });

// styleAid - handle loading and unloading of stylesheets in a quick and easy way
this.__defineGetter__('styleAid', function() { delete this.styleAid; moduleAid.load('utils/styleAid'); return styleAid; });

// windowMediator - Aid object to help with window tasks involving window-mediator and window-watcher
this.__defineGetter__('windowMediator', function() { delete this.windowMediator; moduleAid.load('utils/windowMediator'); return windowMediator; });

// browserMediator - Aid object to track and perform tasks on all document browsers across the windows
this.__defineGetter__('browserMediator', function() { windowMediator; delete this.browserMediator; moduleAid.load('utils/browserMediator'); return browserMediator; });

// observerAid - Helper for adding and removing observers
this.__defineGetter__('observerAid', function() { delete this.observerAid; moduleAid.load('utils/observerAid'); return observerAid; });

// privateBrowsingAid - Private browsing mode listener
this.__defineGetter__('privateBrowsingAid', function() { observerAid; delete this.privateBrowsingAid; moduleAid.load('utils/privateBrowsingAid'); return privateBrowsingAid; });

// overlayAid - to use overlays in my bootstraped add-ons
this.__defineGetter__('overlayAid', function() { browserMediator; observerAid; delete this.overlayAid; moduleAid.load('utils/overlayAid'); return overlayAid; });

// stringsAid - use for getting strings out of bundles from .properties locale files
this.__defineGetter__('stringsAid', function() { delete this.stringsAid; moduleAid.load('utils/stringsAid'); return stringsAid; });

// objectWatcher - This acts as a replacement for the event DOM Attribute Modified, works for both attributes and object properties
this.__defineGetter__('objectWatcher', function() { delete this.objectWatcher; moduleAid.load('utils/objectWatcher'); return objectWatcher; });

this.__defineGetter__('keysetAid', function() { windowMediator; delete this.keysetAid; moduleAid.load('utils/keysetAid'); return keysetAid; });

// xmlHttpRequest() - aid for quickly using the nsIXMLHttpRequest interface
this.xmlHttpRequest = function(url, callback, method, async) { loadSandboxTools(); return xmlHttpRequest(url, callback, method, async); };

// aSync() - lets me run aFunc asynchronously
this.aSync = function(aFunc, aDelay) { loadSandboxTools(); return aSync(aFunc, aDelay); };

// dispatch() - creates and dispatches an event and returns (bool) whether preventDefault was called on it
this.dispatch = function(obj, properties) { loadSandboxTools(); return dispatch(obj, properties); };

// compareFunction() - returns (bool) if a === b
this.compareFunction = function(a, b, strict) { loadSandboxTools(); return compareFunction(a, b, strict); };

// isAncestor() - Checks if aNode decends from aParent
this.isAncestor = function(aNode, aParent) { loadSandboxTools(); return isAncestor(aNode, aParent); };

// hideIt() - in theory this should collapse whatever I want
this.hideIt = function(aNode, show) { loadSandboxTools(); return hideIt(aNode, show); };

// trim() - trims whitespaces from a string
this.trim = function(str) { loadSandboxTools(); return trim(str); };

// closeCustomize() - useful for when you want to close the customize toolbar dialogs for whatever reason
this.closeCustomize = function() { loadSandboxTools(); return closeCustomize(); };

// replaceObjStrings() - replace all objName and objPathString references in the node attributes and its children with the proper names
this.replaceObjStrings = function(node) { loadSandboxTools(); return replaceObjStrings(node); };

// setAttribute() - helper me that saves me the trouble of checking if the obj exists first everywhere in my scripts; yes I'm that lazy
this.setAttribute = function(obj, attr, val) { loadAttributesTools(); return setAttribute(obj, attr, val); };

// removeAttribute() - helper me that saves me the trouble of checking if the obj exists first everywhere in my scripts; yes I'm that lazy
this.removeAttribute = function(obj, attr) { loadAttributesTools(); return removeAttribute(obj, attr); };

// toggleAttribute() - sets attr on obj if condition is true; I'm uber lazy
this.toggleAttribute = function(obj, attr, condition, trueval, falseval) { loadAttributesTools(); return toggleAttribute(obj, attr, condition, trueval, falseval); };

this.loadSandboxTools = function() {
	delete this.xmlHttpRequest;
	delete this.aSync;
	delete this.dispatch;
	delete this.compareFunction;
	delete this.isAncestor;
	delete this.hideIt;
	delete this.trim;
	delete this.closeCustomize;
	delete this.replaceObjStrings;
	moduleAid.load('utils/sandboxTools');
};

this.loadAttributesTools = function() {
	delete this.setAttribute;
	delete this.removeAttribute;
	delete this.toggleAttribute;
	moduleAid.load('utils/attributes');
};

moduleAid.UNLOADMODULE = function() {
	moduleAid.clean();
};
