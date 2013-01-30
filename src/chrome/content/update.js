var prefs = Cc["@mozilla.org/preferences-service;1"]
				.getService(Ci.nsIPrefService).getBranch("");

function upgradeMS(o, n, d, g, s)
{
	if (typeof(n) == "undefined")
		n = null;

	if (typeof(d) == "undefined")
		d = true;

	if (typeof(g) == "undefined")
		g = "Bool";

	if (typeof(s) == "undefined")
		s = g;

	var aCount = {value:0};
	var r = null;
	var c = null;
	prefs.getChildList(o, aCount);
	if( aCount.value != 0 )
	{
		try
		{
			if (g == "Complex")
			{
				r = prefs.getComplexValue(o, Ci.nsISupportsString).data;
			}
			else
				r = prefs['get' + g + 'Pref'](o)
		}
		catch(e)
		{
			r=null
		};
		if (d)
			try{prefs.deleteBranch(o)}catch(e){};

		if (n)
			if (s == "Complex")
			{
				let c = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
				c.data = r;
				coomanPlus.prefs.setComplexValue(n, Ci.nsISupportsString, c);
			}
			else
				coomanPlus.prefs['set' + s + 'Pref'](n, r);
	}
	return r;
}


var compare = Cc["@mozilla.org/xpcom/version-comparator;1"]
								.getService(Ci.nsIVersionComparator).compare;
var v = document.getElementById("coomanPlusWindow").getAttribute("version");
if (v != coomanPlus.app.version)
{
	var r;
	if (compare(v, "0.4") < 0)
	{
		r = upgradeMS("addneditcookies.lastsearch.host", null, true, "Char");
		if (r)
			document.getElementById('lookupcriterium').setAttribute("filter", r);

		upgradeMS("addneditcookies.displaydeleteconfirmation", "delconfirm");
	}
	if (compare(v, "1.0") < 0)
	{
		upgradeMS("extensions.addneditcookiesplus.autofilter", "autofilter");
		upgradeMS("extensions.addneditcookiesplus.autoupdate", "autoupdate");
		upgradeMS("extensions.addneditcookiesplus.topmost", "topmost");
	}
	if (compare(v, "1.3") < 0)
	{
		var extra = upgradeMS("extensions.cookiesmanagerplus.showextra");
		if (extra)
		{
			coomanPlus.prefs.setBoolPref("viewcreationtime", true);
			coomanPlus.prefs.setBoolPref("viewlastaccessed", true);
			coomanPlus.prefs.setBoolPref("viewishttponly", true);
			coomanPlus.prefs.setBoolPref("viewpolicy", true);
			coomanPlus.prefs.setBoolPref("viewstatus", true);
		}
		upgradeMS("extensions.cookiesmanagerplus.showextratree");
		upgradeMS("extensions.cookiesmanagerplus.clipboardtemplate", "templateclipboard", true, "Char");
	}
	if (compare(v, "1.5") < 0)
	{
		var v = upgradeMS("extensions.cookiesmanagerplus.viewname");
		if (v !== null)
			document.getElementById("row_name").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewhost");
		if (v !== null)
			document.getElementById("row_host").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewvalue");
		if (v !== null)
			document.getElementById("row_value").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewpath");
		if (v !== null)
			document.getElementById("row_path").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewexpires");
		if (v !== null)
			document.getElementById("row_expires").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewissecure");
		if (v !== null)
			document.getElementById("row_isSecure").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewisprotected");
		if (v !== null)
			document.getElementById("row_isProtected").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewishttponly");
		if (v !== null)
			document.getElementById("row_isHttpOnly").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewlastaccessed");
		if (v !== null)
			document.getElementById("row_lastAccessed").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewcreationtime");
		if (v !== null)
			document.getElementById("row_creationTime").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewpolicy");
		if (v !== null)
			document.getElementById("row_policy").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.viewstatus");
		if (v !== null)
			document.getElementById("row_status").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.expireprogress");
		if (v !== null)
			document.getElementById("expireProgress").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.expirecountdown");
		if (v !== null)
			document.getElementById("expireProgressText").setAttribute("collapsed", !v);

		v = upgradeMS("extensions.cookiesmanagerplus.vieworder", null, true, "Char");
		if (v !== null)
			document.getElementById("cookieInfoRows").setAttribute("order", v);
	}
	if (compare(v, "1.5.1") < 0)
	{
		if (coomanPlus.prefs.prefHasUserValue("autoupdate"))
			v =	coomanPlus.prefs.getBoolPref("autoupdate");
		else
			v = true;

		coomanPlus.prefs.setBoolPref("autoupdate", v)
	}
	if (typeof(v) != "string" || compare(v, "1.6a1pre") < 0)
	{
		upgradeMS("extensions.cookiesmanagerplus.delconfirm", "delconfirm");
		upgradeMS("extensions.cookiesmanagerplus.autofilter", "autofilter");
		upgradeMS("extensions.cookiesmanagerplus.autoupdate", "autoupdate");
		upgradeMS("extensions.cookiesmanagerplus.topmost", "topmost");
		upgradeMS("extensions.cookiesmanagerplus.dateformat", "dateformat", true, "Char");
		upgradeMS("extensions.cookiesmanagerplus.searchhost", "searchhost");
		upgradeMS("extensions.cookiesmanagerplus.searchname", "searchname");
		upgradeMS("extensions.cookiesmanagerplus.searchcontent", "searchcontent");
		upgradeMS("extensions.cookiesmanagerplus.searchcase", "searchcase");
		upgradeMS("extensions.cookiesmanagerplus.simplehost", "simplehost", true, "Int");
		upgradeMS("extensions.cookiesmanagerplus.cookieculler", "cookieculler");
		upgradeMS("extensions.cookiesmanagerplus.cookiecullerdelete", "cookiecullerdelete");
		upgradeMS("extensions.cookiesmanagerplus.templateclipboard", "templateclipboard", true, "Complex");
		upgradeMS("extensions.cookiesmanagerplus.templatefile", "templatefile", true, "Complex");
		upgradeMS("extensions.cookiesmanagerplus.backupencrypt", "backupencrypt");
		upgradeMS("extensions.cookiesmanagerplus.backupfilename", "backupfilename", true, "Complex");
		upgradeMS("extensions.cookiesmanagerplus.alwaysusecmp", "alwaysusecookiesmanagerplus");
	// a trick that moves saved persist data from previous version
		coomanPlus._openDialog("chrome://cookiesmanagerplus/content/cookiesmanagerplus.xul", "_blank", "chrome,modal", {window: window, document: document});
	}

	if (compare(v, coomanPlus.app.version) != 0)
		document.getElementById("coomanPlusWindow").setAttribute("version", coomanPlus.app.version);
}
coomanPlusCore.updated = true;
