this.VERSION = '1.0.0';

var engineName = document.getElementById('omnibar-defaultEngineName');
setWatchers(engineName);

this.VARSLIST = ['engineName'];

this.LOADMODULE = function() {
	engineName.addPropertyWatcher('value', openLocation);
};

this.UNLOADMODULE = function() {
	engineName.removePropertyWatcher('value', openLocation);
};
