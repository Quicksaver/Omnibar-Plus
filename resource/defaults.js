var defaultsVersion = '1.0.4';
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
	autoSelect: true
};

function startConditions(aReason) {
	AddonManager.getAddonByID("omnibar@ajitk.com", function(addon) {
		if(addon && addon.isActive) {
			continueStartup(aReason);
		} else {
			windowMediator.callOnMostRecent(function(window) {
				window.alert(stringsAid.get('addon', 'requirementWarning'));
			}, 'navigator:browser');
			disable();
		}
	});
	return false;
}

function startAddon(window) {
	prepareObject(window);
	window[objName].moduleAid.load(objName, started == APP_STARTUP);
}

function stopAddon(window) {
	removeObject(window);
}

function windowWatcher(aSubject, aTopic) {
	if(unloaded) { return; }
	windowMediator.callOnLoad(aSubject, startAddon, 'navigator:browser');
}

// Toggle F6 functionality
function toggleF6() {
	moduleAid.loadIf("F6", prefAid.f6);
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
	
	// Toggle F6 functionality
	toggleF6();
	prefAid.listen('f6', toggleF6);
	
	// Apply overlay to Omnibar preferences dialog
	overlayAid.overlayURI("chrome://omnibar/content/options.xul", "chrome://omnibarplus/content/omnibarOptions.xul", 
		function(window) {
			// This prevents a (very weird) zombie compartment. Without this fix, if I enable the add-on, open Omnibar's preferences dialog, close it and disable the add-on,
			// a ZC will exist until I open Ominbar's preferences dialog again. This ZC won't exist if I disable the add-on with the preferences dialog still open or if
			// I never open it in the first place. With this fix, there will only be a ZC if I disable the add-on with the preferences dialog still opened, but it will
			// disappear once I close the dialog (it will hold the reference to runOnce() from within listenOnce()).
			listenOnce(window, "unload", function(event, window) { overlayAid.unloadAll(window); });
			
			prepareObject(window);
			window[objName].moduleAid.load('options');
		},
		function(window) {
			preparePreferences(window);
			window[objName].onOverlayLoad();
		},
		function(window) {
			removeObject(window);
		}
	);
	if(Services.appinfo.OS == 'Darwin') {
		overlayAid.overlayURI("chrome://omnibarplus/content/omnibarOptions.xul", "chrome://omnibarplus/content/omnibarOptionsMac.xul");
	}
}

function onShutdown(aReason) {
	// remove the add-on from all windows
	windowMediator.callOnAll(stopAddon, 'navigator:browser', true);
}
