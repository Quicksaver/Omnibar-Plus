// OS string
var OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

// omnibar menu item in urlbar (search button)		
var omnibarClicker = document.getElementById('omnibar-in-urlbar');

// Left click: default omnibar functionality; Middle Click: open the search engine homepage
var onEngineClick = function(e) {
	var modKey = (OS == 'Darwin') ? e.metaKey : e.ctrlKey;
	
	if(e.button == 0 && !e.altKey && !modKey) {
		document.getElementById('omnibar-engine-menu').openPopup(Omnibar._imageElBox, "after_end", -1, -1);
		e.preventDefault();
		e.stopPropagation();
	}
	else if(e.button == 1
	|| (e.button == 0 && (e.altKey || modKey)) ) {
		var openHere = 'current';
		if(e.button == 1 || e.altKey || (Omnibar._prefSvc.getBoolPref("browser.search.openintab") && gBrowser.getBrowserForTab(gBrowser.selectedTab).currentURI.spec != "about:blank")) {
			openHere = 'tab';
		}
		openUILinkIn(Omnibar._ss.currentEngine.searchForm, openHere);
		
		e.preventDefault();
		e.stopPropagation();
	}
};

var toggleMiddleClick = function() {
	omnibarClicker.removeAttribute('onclick'); // We need to remove this first
	if(prefAid.middleClick) {
		listenerAid.remove(omnibarClicker, 'click', Omnibar.onButtonClick, false, false);
		listenerAid.add(omnibarClicker, 'click', onEngineClick, false);
	}
	else {
		listenerAid.remove(omnibarClicker, 'click', onEngineClick, false); 
		listenerAid.add(omnibarClicker, 'click', Omnibar.onButtonClick, false, false);
	}
};

prefAid.init(objPathString, ['middleClick']);
prefAid.listen('middleClick', function() { toggleMiddleClick(); });

toggleMiddleClick();
