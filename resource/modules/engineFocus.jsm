moduleAid.VERSION = '1.0.3';
moduleAid.VARSLIST = ['engineName'];

this.engineName = $('omnibar-defaultEngineName');

moduleAid.LOADMODULE = function() {
	setWatchers(engineName);
	engineName.addAttributeWatcher('value', window.openLocation);
};

moduleAid.UNLOADMODULE = function() {
	setWatchers(engineName, true);
};
