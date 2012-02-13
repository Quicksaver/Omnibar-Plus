// This requires the utils module
moduleAid.load("chrome://"+objPathString+"/content/utils.jsm");

var engineName = document.getElementById('omnibar-defaultEngineName');
setWatchers(engineName);

var toggleEngineFocus = function() {
	if(prefAid.engineFocus) {
		engineName.addPropertyWatcher('value', openLocation);
	} else {
		engineName.removePropertyWatcher('value', openLocation);
	}
};

toggleEngineFocus();
