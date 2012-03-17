var defaultsVersion = '1.0.0';
var objName = 'OmnibarPlus';
var objPathString = 'omnibarplus';
var prefList = {
	f6: true,
	middleClick: true,
	organizePopup: true,
	animated: false,
	engineFocus: true,
	animatedScheme: 'sky',
	agrenon: false,
	smarterwiki: false,
	organize0: 'EE',
	organize1: 'agrenon',
	organize2: 'smarterwiki',
	organize3: 'omnibar',
	autoSelect: 'true'
};

function startConditions(aReason) {
	AddonManager.getAddonByID("omnibar@ajitk.com", function(addon) {
		if(addon && addon.isActive) {
			continueStartup(aReason);
		}
		else {
			disable();
		}
	});
	return false;
}

function startAddon(window) {
	let obj = prepareObject(window);
	
	obj.moduleAid.load(objName, started == APP_STARTUP);
}

function stopAddon(window) {
	removeObject(window);
}

function windowWatcher(aSubject, aTopic) {
	windowMediator.callOnLoad(aSubject, startAddon, 'navigator:browser');
}

function onStartup(aReason) {
	AddonManager.getAddonByID("{dd7515c0-0820-4234-806b-74197fa5955c}", function(addon) {
		prefAid.agrenon = (addon && addon.isActive) ? true : false;
	});
	AddonManager.getAddonByID("smarterwiki@wikiatic.com", function(addon) {
		prefAid.smarterwiki = (addon && addon.isActive) ? true : false;
	});
	
	// Apply the add-on to every window opened and to be opened
	windowMediator.callOnAll(startAddon, 'navigator:browser');
	windowMediator.register(windowWatcher, 'domwindowopened');
	
	// Apply overlay to Omnibar preferences dialog
	overlayAid.overlayURI("chrome://omnibar/content/options.xul", "chrome://omnibarplus/content/omnibarOptions.xul", 
		function(window) {
			let optionsObj = prepareObject(window);
			optionsObj.moduleAid.load('options');
		},
		function(window) {
			preparePreferences(window);
			window[objName].onOverlayLoad();
		},
		function(window) {
			window[objName].onOverlayUnload();
		}
	);
	if(Services.appinfo.OS == 'Darwin') {
		overlayAid.overlayURI("chrome://omnibarplus/content/omnibarOptions.xul", "chrome://omnibarplus/content/omnibarOptionsMac.xul");
	}
}

function onShutdown(aReason) {
	// remove the add-on from all windows
	windowMediator.callOnAll(stopAddon, 'navigator:browser');
	windowMediator.unregister(windowWatcher, 'domwindowopened');
}
