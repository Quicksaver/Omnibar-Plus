moduleAid.VERSION = '1.0.5';

this.__defineGetter__('Omnibar', function() { return window.Omnibar; });
this.__defineGetter__('gBrowser', function() { return window.gBrowser; });

// omnibar menu item in urlbar (search button)		
this.omnibarClicker = $('omnibar-in-urlbar');

// Left click: default omnibar functionality; Middle Click: open the search engine homepage
this.onEngineClick = function(e) {
	var modKey = (Services.appinfo.OS == 'Darwin') ? e.metaKey : e.ctrlKey;
	
	if(e.button == 0 && !e.altKey && !modKey) {
		$('omnibar-engine-menu').openPopup(Omnibar._imageElBox, "after_end", -1, -1);
		e.preventDefault();
		e.stopPropagation();
	}
	else if(e.button == 1
	|| (e.button == 0 && (e.altKey || modKey)) ) {
		var openHere = 'current';
		if(e.button == 1 || e.altKey || (Omnibar._prefSvc.getBoolPref("browser.search.openintab") && window.gBrowser.getBrowserForTab(window.gBrowser.selectedTab).currentURI.spec != "about:blank")) {
			openHere = 'tab';
		}
		window.openUILinkIn(Omnibar._ss.currentEngine.searchForm, openHere);
		
		e.preventDefault();
		e.stopPropagation();
	}
};

moduleAid.LOADMODULE = function() {
	omnibarClicker.removeAttribute('onclick'); // We need to remove this first
	listenerAid.add(omnibarClicker, 'click', onEngineClick, false);
};

moduleAid.UNLOADMODULE = function() {
	listenerAid.remove(omnibarClicker, 'click', onEngineClick, false); 
	setAttribute(omnibarClicker, 'onclick', 'Omnibar.onButtonClick(event);');
};
