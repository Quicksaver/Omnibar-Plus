var OmnibarPlus = {
	initialized: false,
	objName: 'OmnibarPlus',
	objPathString: 'omnibarplus',
	
	startup: function() {
		this.mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		this.mozIJSSubScriptLoader.loadSubScript("chrome://omnibarplus/content/utils.jsm", this);
		this.listenerAid.add(window, "load", this.preinit, false, true);
	},
	
	preinit: function() {
		this.moduleAid.load("chrome://omnibarplus/content/omnibarPlus.jsm");
	}
}

OmnibarPlus.startup();
