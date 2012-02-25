this.VERSION = '1.0.1';
this.VARSLIST = ['engineName'];

this.engineName = document.getElementById('omnibar-defaultEngineName');
setWatchers(engineName);

this.LOADMODULE = function() {
	engineName.addPropertyWatcher('value', openLocation);
};

this.UNLOADMODULE = function() {
	engineName.removePropertyWatcher('value', openLocation);
};
