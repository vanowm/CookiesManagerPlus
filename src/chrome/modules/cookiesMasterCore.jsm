const EXPORTED_SYMBOLS = ["cookiesMasterCore"];
var cookiesMasterCore = {
	GUID: '{bb6bc1bb-f824-4702-90cd-35e2fb24f25d}',
	aWindow: null,
	aWindowOptions: null,
	lastKeyDown: [],
	prefNoObserve: false,
	updated: false,
	openCSM: function(arg)
	{
		var win = this.aWindow;
		if (!arg && win)
			win.focus();
		else
		{
			if (arg && typeof(arg) == "object")
				arg.wrappedJSObject = arg;

			var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
												 .getService(Components.interfaces.nsIWindowWatcher);
			var win = ww.openWindow(null, "chrome://cookiesmaster/content/cookiesMaster.xul",
															"cookiesMasterWindow", "chrome,resizable=yes,toolbar=no,statusbar=no,scrollbar=no,centerscreen", arg);
			win.focus();
		}
		return win
	},
}
