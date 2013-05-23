moduleAid.VERSION = '1.1.0';

this.__defineGetter__('popupRichPanel', function() { return $('PopupAutoCompleteRichResult'); });
this.__defineGetter__('popupPanel', function() { return $('PopupAutoComplete'); });
this.__defineGetter__('usingRichlist', function() { return (gURLBar.popup == popupRichPanel); });

this.toggleScheme = function() {
	setAttribute(popupRichPanel, 'animatedPopup', prefAid.animatedScheme);
	setAttribute(popupPanel, 'animatedPopup', prefAid.animatedScheme);
	if(Services.appinfo.OS != 'Darwin' && Services.appinfo.OS != 'WINNT') {
		setAttribute(popupRichPanel, 'linux', 'true');
		setAttribute(popupPanel, 'linux', 'true');
	}
	loadSheets();
};

this.loadSheets = function() {
	styleAid.load('animatedScheme', prefAid.animatedScheme);
	styleAid.load('animatedPopup', 'autocompletepopup');
};

// This is used so the row height value is updated whenever the popup style is changed, preventing wrong popup heights sometimes
this.resetRowHeight = function() {
	popupRichPanel._rowHeight = 0;
};

moduleAid.LOADMODULE = function() {
	prefAid.listen('animatedScheme', toggleScheme);
	
	toggleScheme();
	
	// Sometimes the sheets are unloaded for some reason
	listenerAid.add(popupRichPanel, 'popupshowing', loadSheets, false);
	listenerAid.add(popupPanel, 'popupshowing', loadSheets, false);
	
	// Bugfix: it wouldn't apply the theme at startup when using the slim style, so we force a reload of the theme in this case
	if(!usingRichlist || !prefAid.omnibar) {
		aSync(function() {
			if(UNLOADED) { return; }
			var actual = prefAid.animatedScheme;
			prefAid.animatedScheme = (actual == 'sky') ? 'ruby' : 'sky';
			prefAid.animatedScheme = actual;
		});
	}
	
	this.backups = { adjustHeight: popupRichPanel.adjustHeight };
	popupRichPanel.adjustHeight = function adjustHeight() {
		// Figure out how many rows to show
		let rows = this.richlistbox.childNodes;
		let numRows = Math.min(this._matchCount, this.maxRows, rows.length);
		
		// Default the height to 0 if we have no rows to show
		let height = 0;
		if(numRows) {
			if(!this._rowHeight) {
				// When using the full richlist with the animated style, the height can change
				let i = 0;
				while(i == this.richlistbox.selectedIndex || i == this.richlistbox.currentIndex) { i++; }
				if(i < rows.length) {
					let firstRowRect = rows[i].getBoundingClientRect();
					this._rowHeight = firstRowRect.height;
				}
			}
			
			// Calculate the height to have the first row to last row shown
			height = this._rowHeight * numRows;
		}
		
		// Only update the height if we have a non-zero height and if it
		// changed (the richlistbox is collapsed if there are no results)
		if(height && height != this.richlistbox.height)
			this.richlistbox.height = height;
	};
	
	resetRowHeight();
};

moduleAid.UNLOADMODULE = function() {
	if(this.backups) {
		popupRichPanel.adjustHeight = this.backups.adjustHeight;
		delete this.backups;
	}
	
	resetRowHeight();
	
	prefAid.unlisten('animatedScheme', toggleScheme);
	
	popupRichPanel.removeAttribute('animatedPopup');
	popupPanel.removeAttribute('animatedPopup');
	popupRichPanel.removeAttribute('linux');
	popupPanel.removeAttribute('linux');
	
	listenerAid.remove(popupRichPanel, 'popupshowing', loadSheets, false);
	listenerAid.remove(popupPanel, 'popupshowing', loadSheets, false);
	
	if(UNLOADED) {
		styleAid.unload('animatedPopup');
		styleAid.unload('animatedScheme');
	}
};
