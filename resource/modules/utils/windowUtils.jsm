moduleAid.VERSION = '2.0.7';
moduleAid.LAZY = true;

// listenerAid - Object to aid in setting and removing all kinds of event listeners to an object;
this.__defineGetter__('listenerAid', function() { delete this.listenerAid; moduleAid.load('utils/listenerAid'); return listenerAid; });

// timerAid - Object to aid in setting, initializing and cancelling timers
this.__defineGetter__('timerAid', function() { delete this.timerAid; moduleAid.load('utils/timerAid'); return timerAid; });

// privateBrowsingAid - Private browsing mode aid
this.__defineGetter__('privateBrowsingAid', function() { observerAid; delete this.privateBrowsingAid; moduleAid.load('utils/privateBrowsingWindow'); return privateBrowsingAid; });

// toCode - allows me to modify a function quickly and safely from within my scripts
this.__defineGetter__('toCode', function() { delete this.toCode; moduleAid.load('utils/toCode'); return toCode; });

// aSync() - lets me run aFunc asynchronously, basically it's a one shot timer with a delay of aDelay msec
this.aSync = function(aFunc, aDelay) { loadWindowTools(); return aSync(aFunc, aDelay); };

this.loadWindowTools = function() {
	delete this.aSync;
	moduleAid.load('utils/windowTools');
};

moduleAid.LOADMODULE = function() {
	listenerAid.add(window, 'unload', function(e) {
		window.willClose = true; // window.closed is not reliable in some cases
		for(var i=0; i<fullClean.length; i++) {
			fullClean[i](window);
		}
		delete window.willClose;
	}, false, true);
};

moduleAid.UNLOADMODULE = function() {
	listenerAid.clean(); // I'm leaving this one here because there's a call to it in the load function and because why not
	moduleAid.clean();
};
