moduleAid.VERSION = '1.0.2';
moduleAid.VARSLIST = ['engineName'];

this.engineName = document.getElementById('omnibar-defaultEngineName');

moduleAid.LOADMODULE = function() {
	setWatchers(engineName);
	engineName.addAttributeWatcher('value', window.openLocation);
};

moduleAid.UNLOADMODULE = function() {
	setWatchers(engineName, true);
};
