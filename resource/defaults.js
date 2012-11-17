var defaultsVersion = '1.0.6';
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
	organize0: 'bookmark',
	organize1: 'favicon',
	organize2: 'agrenon',
	organize3: 'smarterwiki',
	organize4: 'omnibar',
	organize5: 'EE',
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
	window[objName].moduleAid.load(objName, true);
}

function stopAddon(window) {
	removeObject(window);
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
	
	// Make sure that we only have one entry of the same type in the organizing categories, duplicates could happen when adding new entries in new version
	var checkEntries = {};
	for(var i=0; i<=5; i++) {
		if(checkEntries[prefAid['organize'+i]]) {
			prefAid.reset('organize0');
			prefAid.reset('organize1');
			prefAid.reset('organize2');
			prefAid.reset('organize3');
			prefAid.reset('organize4');
			prefAid.reset('organize5');
			break;
		}
		checkEntries[prefAid['organize'+i]] = true;
	}
	
	// Apply the add-on to every window opened and to be opened
	windowMediator.callOnAll(startAddon, 'navigator:browser');
	windowMediator.register(startAddon, 'domwindowopened', 'navigator:browser');
	
	// Toggle F6 functionality
	toggleF6();
	prefAid.listen('f6', toggleF6);
	
	// Apply overlay to Omnibar preferences dialog
	overlayAid.overlayURI("chrome://omnibar/content/options.xul", "chrome://"+objPathString+"/content/omnibarOptions.xul", 
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
		overlayAid.overlayURI("chrome://"+objPathString+"/content/omnibarOptions.xul", "chrome://"+objPathString+"/content/omnibarOptionsMac.xul");
	}
}

function onShutdown(aReason) {
	// remove the add-on from all windows
	windowMediator.callOnAll(stopAddon, 'navigator:browser', null, true);
}
