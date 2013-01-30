Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");

var coomanPlus = {
	prefs: null,
	load: function()
	{
		coomanPlus.init();
	},
	init: function()
	{
		this.prefs = coomanPlusCommon.prefs;
		var version = this.prefs.getCharPref("version");
		if (!coomanPlusCore.inited)
		{
			if (version != this.app.version)
			{
				this.prefs.setCharPref("version", this.app.version);
				this.openChanges()
				var compare = Cc["@mozilla.org/xpcom/version-comparator;1"]
												.getService(Ci.nsIVersionComparator).compare;
			}
		}
	},
	openCookieEditor: function (arg)
	{
		coomanPlusCore.openCSM(arg);
	},
	menu: function(e)
	{
		var m = document.getElementById("coomanPlus_button_menu");
		var m2 = document.getElementById("coomanPlus_tools_menuitem");
		var m3 = document.getElementById("coomanPlus_appmenu_menuitem");
		try
		{
			var host = gBrowser.currentURI.host;
		}
		catch(er){};
		if (host)
		{
			var l = this.strings.current_label + " (" + host + ")";
			m.label = l
			m2.label = l
			if (m3)
				m3.label = l
			
			document.getElementById("coomanPlus_tools_menuitem").hidden = false;
		}
		else
		{
			if (!e)
				return false;

			document.getElementById("coomanPlus_tools_menuitem").hidden = true;
		}
		return false;
	},
	openChanges: function()
	{
		if (this.prefs.getBoolPref("showchangeslog"))
		{
			var url = "chrome://cookiesmanagerplus/content/changes.xul";
			openUILinkIn(url, "tab", false, null, null);
		}
	},
}

window.addEventListener("load", coomanPlus.load, true);
