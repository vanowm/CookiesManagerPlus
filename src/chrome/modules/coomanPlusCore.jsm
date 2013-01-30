const EXPORTED_SYMBOLS = ["coomanPlusCore"];
var coomanPlusCore = {
	GUID: '{bb6bc1bb-f824-4702-90cd-35e2fb24f25d}',
	aWindow: null,
	aWindowOptions: null,
	lastKeyDown: [],
	prefNoObserve: false,
	updated: false,
	inited: false,
	openCSM: function(args)
	{
		if (args && typeof(args) == "object")
			args.wrappedJSObject = args;

		var win = this.aWindow;
		if (win)
		{
			var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
			var observerSubject = {obj: "initWindow", data: args};
			observerSubject.wrappedJSObject = observerSubject;

			observerService.notifyObservers(observerSubject, "coomanPlusWindow", null);
			win.focus();
		}
		else
		{
			var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
												 .getService(Components.interfaces.nsIWindowWatcher);
			var win = ww.openWindow(null, "chrome://cookiesmanagerplus/content/cookiesmanagerplus.xul",
															"coomanPlusWindow", "chrome,resizable=yes,toolbar=no,statusbar=no,scrollbar=no,centerscreen", args);
			win.focus();
		}
		return win
	},
}
