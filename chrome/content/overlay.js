var OmnibarPlus = {
	initialized: false,
	objName: 'OmnibarPlus',
	objPathString: 'omnibarplus',
	
	startup: function() {
		this.mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		this.mozIJSSubScriptLoader.loadSubScript("resource://omnibarplus/modules/utils.jsm", this);
		this.listenerAid.add(window, "load", this.preinit, false, true);
	},
	
	preinit: function() {
		this.moduleAid.load("resource://omnibarplus/modules/omnibarPlus.jsm");
	}
}

OmnibarPlus.startup();
