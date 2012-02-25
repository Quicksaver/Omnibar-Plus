var OmnibarPlus = {
	objName: 'OmnibarPlus',
	objPathString: 'omnibarplus',
	
	startup: function() {
		this.mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		this.mozIJSSubScriptLoader.loadSubScript("resource://omnibarplus/modules/utils.jsm", this);
		this.listenerAid.add(window, "load", this.preinit, false, true);
	},
	
	preinit: function() {
		this.moduleAid.loadIf("resource://omnibarplus/modules/omnibarPlus.jsm", (typeof(Omnibar) != 'undefined'));
	}
}

OmnibarPlus.startup();
