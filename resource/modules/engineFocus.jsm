moduleAid.VERSION = '1.0.4';

moduleAid.LOADMODULE = function() {
	objectWatcher.addAttributeWatcher($('omnibar-defaultEngineName'), 'value', window.openLocation);
};

moduleAid.UNLOADMODULE = function() {
	objectWatcher.removeAttributeWatcher($('omnibar-defaultEngineName'), 'value', window.openLocation);
};
