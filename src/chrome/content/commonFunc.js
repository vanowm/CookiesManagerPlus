coomanPlus.trim = function(s)
{
	return s.replace(/^\s+|\s+$/g,"");
}

coomanPlus.numberClean = function(s)
{
	return s.replace(/-[^0-9]/g,"");
}

coomanPlus.clone = function(o)
{
	var n = {};
	for(var i in o)
		n[i] = o[i];
	return n;
}

coomanPlus.getExpiresString = function(expires, format)
{
	format = typeof format == "undefined" ? this.prefDateFormat ? this.prefDateFormat : null : format;
	if (expires)
	{
		var date;
		if (format)
		{
			date = this.date(format,  expires);
			if (date)
				return date;
		}
		date = new Date(1000 * expires)
		return coomanPlusCommon._ds.FormatDateTime(1,	coomanPlusCommon._ds.dateFormatLong,
																			coomanPlusCommon._ds.timeFormatSeconds,
																			date.getFullYear(),
																			date.getMonth() + 1,
																			date.getDate(),
																			date.getHours(),
																			date.getMinutes(),
																			date.getSeconds()
																	);

	}
	return this.string("expireAtEndOfSession");
}

coomanPlus.string = function(s)
{
	if (s in this.strings)
		return this.strings[s];

	try
	{
		return this._cb.getString(s);
	}
	catch(e)
	{
		if ("_cb2" in this)
			try
			{
				return this._cb2.getString(s);
			}
			catch(e)
			{
				return "";
			}
	}
	return "";
}

coomanPlus._cookieGetExtraInfo = function(aCookie)
{
	if (aCookie.extra)
		return aCookie;

	var list = coomanPlusCommon._cm2.getCookiesFromHost(aCookie.host);
	while (list.hasMoreElements())
	{
		var c = list.getNext();
		if (!c || !(c instanceof Ci.nsICookie))
			break;
		if (this._cookieEquals(aCookie, c))
		{
			aCookie = new this.cookieObject(c.QueryInterface(Ci.nsICookie2), aCookie.sel, aCookie.added || null);
			aCookie.extra = true;
			break;
		}
	}
	return aCookie;
}

coomanPlus.cookieObject = function(aCookie, sel, updated)
{
	this.aCookie					= aCookie;
	this.name							= aCookie.name;
	this.value						= aCookie.value;
	this.isDomain					= aCookie.isDomain;
	this.host							= aCookie.host;
	this.rawHost					= aCookie.rawHost ? aCookie.rawHost : (aCookie.host.charAt(0) == "." ? aCookie.host.substring(1, aCookie.host.length) : aCookie.host);
	this.simpleHost				= this.rawHost.charAt(0) == "." ? this.rawHost.substring(1, this.rawHost.length) : this.rawHost.match(/^www\./) ? this.rawHost.replace(/^www\./, "") : this.rawHost;
	this.rootHost					= this.rawHost.replace(/^.*\.([^.]+\.[^.]+)$/, "$1");
	this.path							= aCookie.path;
	this.isSecure					= aCookie.isSecure;
	this.expires					= aCookie.expires;
	this.policy						= aCookie.policy;
	this.status						= "status" in aCookie ? aCookie.status : null;
	this.isSession				= "isSession" in aCookie ? aCookie.isSession : null;
	this.expiry						= "expiry" in aCookie ? aCookie.expiry : null;
	this.creationTime			= "creationTime" in aCookie ? aCookie.creationTime : null;
	this.lastAccessed			= "lastAccessed" in aCookie ? aCookie.lastAccessed : null;
	this.isHttpOnly				= "isHttpOnly" in aCookie ? aCookie.isHttpOnly : null;
	this.sel							= typeof(sel) == "undefined" ? false : sel;
	this.extra						= "extra" in aCookie ? aCookie.extra : false;
	this.isProtected			= coomanPlus.cookieCuller && coomanPlus.cookieCuller.enabled ? coomanPlus.cookieCuller.obj.checkIfProtected(this.name, this.host, this.path) : false;
	this.updated					= typeof(updated) == "undefined" ? null : updated;
}

coomanPlus.clearUserPref = function(p)
{
	if (coomanPlusCommon.prefs.prefHasUserValue(p))
		coomanPlusCommon.prefs.clearUserPref(p);
}

coomanPlus.right = function(str, n)
{
	if (n <= 0)
		return "";

	else if (n > String(str).length)
		return str;

	else
	{
		var iLen = String(str).length;
		return String(str).substring(iLen, iLen - n);
	}
}

coomanPlus.left = function(str, n)
{
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else
		return String(str).substring(0,n);
}

coomanPlus._openDialog = function(a, b, c, arg)
{

	var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
	var browsers = wm.getZOrderDOMWindowEnumerator('', false);
	if (!a.match("/"))
		a = "chrome://cookiesmanagerplus/content/" + a;

	var browser;
	while ((browser = browsers.getNext()))
	{
		if (browser.location.href.toString() == a)
		{
			browser.focus();
			return;
		}
	}
	if (typeof(arg) == "undefined")
		arg = {};

	arg.window = window;
	arg.document = document;
/*
	Cc["@mozilla.org/embedcomp/window-watcher;1"]
		.getService(Ci.nsIWindowWatcher)
		.openWindow(null, a, b, c, arg);
*/
	window.openDialog(a, b, c, arg);
}

coomanPlus.alert = function(msg, title)
{
	var promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
											.getService(Ci.nsIPromptService);
	promptService.alert(window, title || msg, msg);
}

coomanPlus.confirm = function(msg, title)
{
	var promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
											.getService(Ci.nsIPromptService);
	return promptService.confirm(window, title || msg, msg);
}

coomanPlus.accel = "CONTROL";
coomanPlus.keysList = null;
coomanPlus.matchKeys = function(k, l, len)
{
	if (k.length != l.length || (len && k.length < len))
		return false;

	for(var i = 0; i < l.length; i++)
	{
		if (k.indexOf(this.getAccel(l[i])) == -1)
		{
			return false;
		}
	}
	return true;
}

coomanPlus.getKeys = function(e)
{
	var keys = [];
	var keycode = this.getAccel(this.keysList[e.keyCode]);
	if(e.ctrlKey) keys.push(this.getAccel("CONTROL"));
	if(e.altKey) keys.push(this.getAccel("ALT"));
	if(e.metaKey) keys.push(this.getAccel("META"));
	if(e.shiftKey) keys.push(this.getAccel("SHIFT"));

	var modifiers = keys.slice();
	if (keys.indexOf(keycode) == -1)
		keys.push(keycode);
	return [keys, [modifiers, keycode]];
}

coomanPlus.getAccel = function(a)
{
	return this.accel == a ? "ACCEL" : a;
}

coomanPlus.listKeys = function()
{
	if (coomanPlus.keysList !== null)
		return;

	coomanPlus.keysList = [];
	for (var property in KeyEvent)
		coomanPlus.keysList[KeyEvent[property]] = property.replace("DOM_VK_","");

}

window.addEventListener("load", coomanPlus.listKeys, false);

coomanPlus.os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
coomanPlus.appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
try
{
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	AddonManager.getAddonByID(coomanPlusCore.GUID, function(app)
	{
		coomanPlus.app = app;
		if (coomanPlus.inited)
			coomanPlus.load();
	});
}
catch (e)
{
	coomanPlus.app = Cc["@mozilla.org/extensions/manager;1"]
								.getService(Ci.nsIExtensionManager)
								.getItemForID(coomanPlusCore.GUID);
}

coomanPlus.isFF4 = (Cc["@mozilla.org/xpcom/version-comparator;1"]
									.getService(Ci.nsIVersionComparator)
									.compare(coomanPlus.appInfo.version, "4.0b") >= 0);

coomanPlus.isMac = coomanPlus.os == "Darwin";

(coomanPlus.observer = {
	_observerService: Cc["@mozilla.org/observer-service;1"]
														.getService(Ci.nsIObserverService),
	_name: "coomanPlusWindow",
	init: function()
	{
		this._observerService.addObserver(this, this._name, false);
		window.addEventListener("unload", function() { coomanPlus.observer.uninit(); }, false);
	},

	uninit: function()
	{
		this._observerService.removeObserver(this, this._name);
	},

	observe: function(aSubject, aTopic, aData)
	{
		aSubject = aSubject.wrappedJSObject;
		if (aTopic != this._name || !coomanPlus[aSubject.obj])
			return;

		let data = aSubject.data || null;
		coomanPlus[aSubject.obj](data);
	},
}).init();


coomanPlus._escape = function(str, type)
{
	let r = "";
	type = typeof type == "undefined" ? 3 : type;
	if (type & 8)
	{
		str = str.replace(/%/g, "%37");
	}
	for (var i = 0; i < str.length; i++ )
	{
		r += ((type & 1 && str.charCodeAt(i) > 126)
					|| (type & 2 && str.charCodeAt(i) < 32)
					|| (type & 4 && str[i].match(/[\t\r\n]/))) ? encodeURIComponent(str[i]).toLowerCase() : str[i];
	}

	return r
}

coomanPlus._unescape = function(str, type)
{
	type = typeof type == "undefined" ? 3 : type;
	if (type & 7)
	{
		str = str.replace(/%([0-9a-zA-Z]{2})/g, function(a,b)
		{
			this.prev = this.prev || "";
			let s,
					c = a.charCodeAt(0),
					r = a;
			try
			{
				s = decodeURIComponent(this.prev + a);
				c = s.charCodeAt(0)
				this.prev = "";
			}
			catch(e)
			{
				this.prev += a;
				r = s = "";
			}
			if ((type & 4 && [9, 10, 13].indexOf(c) != -1)
					|| (type & 2 && c < 32)
					|| (type & 1 && c > 126))
				r = s;
			return r;
		});
	}
	if (type & 8)
	{
		str = str.replace(/%37/g, "%");
	}
	return str
}

String.prototype.escapeRegExp = function()
{
	return this.replace(/[.*+?^${}()|[\]\/\\]/g, "\\$&");
}

Array.prototype.escapeRegExp = function()
{
	var array = [];
	function e(v, i, a) array[i] = v.escapeRegExp();
	this.forEach(e);
	return array;
}

coomanPlus.saveFile = function(fp, content, silent)
{
//save file block taken from chrome://pippki/content/pippki.js
	var bundle = srGetStrBundle("chrome://pippki/locale/pippki.properties");
	var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	var msg = [true, null, null];
	var written = 0;
	try
	{
		localFile.initWithPath(fp.file.path);
		if (localFile.exists())
			localFile.remove(true);

		localFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0600", 8));
		var fos = Cc["@mozilla.org/network/file-output-stream;1"].
							createInstance(Ci.nsIFileOutputStream);
		// flags: PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
		fos.init(localFile, 0x04 | 0x08 | 0x20, parseInt("0600", 8), 0);
		written = fos.write(content, content.length);
		if (fos instanceof Ci.nsISafeOutputStream)
			fos.finish();
		else
			fos.close();
	}
	catch(e) {
			msg = [false, e, null];
		if (!silent)
			switch (e.result) {
				case Components.results.NS_ERROR_FILE_ACCESS_DENIED:
					msg[2] = bundle.GetStringFromName("writeFileAccessDenied");
					break;
				case Components.results.NS_ERROR_FILE_IS_LOCKED:
					msg[2] = bundle.GetStringFromName("writeFileIsLocked");
					break;
				case Components.results.NS_ERROR_FILE_NO_DEVICE_SPACE:
				case Components.results.NS_ERROR_FILE_DISK_FULL:
					msg[2] = bundle.GetStringFromName("writeFileNoDeviceSpace");
					break;
				default:
					msg[2] = e.message;
					break;
			}
	}
	if (written != content.length)
	{
		if (!msg[2])
			msg[2] = bundle.GetStringFromName("writeFileUnknownError");

			if (silent)
				return msg;

			this.alert(bundle.formatStringFromName("writeFileFailed",[fp.file.path, msg], 2),
									bundle.GetStringFromName("writeFileFailure"));
		return false;
	}
	if (silent)
		return msg;

	return true;
}

coomanPlus.addHash = function(array)
{
//	if (!array.hash)
		array.hash = {};

	function e(v, i, a)
	{
		if (!v.hash)
		{
//			array[i].hash = coomanPlus.binToHex(coomanPlus.getHash(v.host + v.path + v.name, "SHA512"));
//			array.hash[array[i].hash] = i - 1;
		}
	}
	array.forEach(e);
	return array;
};

coomanPlus.updateHash = function(array)
{
	if (!array.hash)
		array.hash = {};

	function e(v, i, a)
	{
		a[i].hash = coomanPlus.binToHex(coomanPlus.getHash(v.host + v.path + v.name, "SHA512"));
		a.hash[a[i].hash] = i;
	}
	array.forEach(e);
	return array;
};

coomanPlus.strToArray2 = function ( str ) {
	var ch, st, re = [];
	for (var i = 0; i < str.length; i++ ) {
		ch = str.charCodeAt(i);  // get char
		st = [];                 // set up "stack"
		do {
			st.push( ch & 0xFF );  // push byte to stack
			ch = ch >> 8;          // shift value down by 1 byte
		}
		while ( ch );
		// add stack contents to result
		// done because chars have "wrong" endianness
		re = re.concat( st.reverse() );
	}
	// return an array of bytes
	return re;
}

coomanPlus.strToArray = function(str2)
{
	return this.strToArray2(str2);

	var r,
			file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile),
			istream = Cc["@mozilla.org/network/file-input-stream;1"].
								createInstance(Ci.nsIFileInputStream),
			bstream = Cc["@mozilla.org/binaryinputstream;1"].
								createInstance(Ci.nsIBinaryInputStream);
	file.append("CookiesManagerPlus" + (new Date).getTime() + ".tmp");
	try
	{
		if (file.exists())
			file.remove(true);

		file.create(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0600", 8));
		var fos = Cc["@mozilla.org/network/file-output-stream;1"].
							createInstance(Ci.nsIFileOutputStream);
		// flags: PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
		fos.init(file, 0x04 | 0x08 | 0x20, parseInt("0600", 8), 0);
		fos.write(str, str.length);
		if (fos instanceof Ci.nsISafeOutputStream)
			fos.finish();
		else
			fos.close();

		istream.init(file, -1, -1, false);
		bstream.setInputStream(istream);
		r = bstream.readByteArray(bstream.available());
		bstream.close();
		istream.close();
//		file.remove(true);
		this.dump("file: " + r);
	}
	catch(e)
	{
		this.dump(e, 1);
		var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
				createInstance(Ci.nsIScriptableUnicodeConverter);
	
		// we use UTF-8 here, you can choose other encodings.
		converter.charset = "UTF-8";
		// data is an array of bytes
		r = converter.convertToByteArray(str);
	}
		var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
				createInstance(Ci.nsIScriptableUnicodeConverter);
	
		// we use UTF-8 here, you can choose other encodings.
		converter.charset = "UTF-8";
		// data is an array of bytes
		r = converter.convertToByteArray(str);
		this.dump("file: " + r);
/*
	var r = [], i;
	str = "" + str;
	for(i = 0; i < str.length; i++)
		r.push(str.charCodeAt(i) & 0xFF);

*/
	return r;
}

coomanPlus.binToHex = function(data)
{
	var r = "";
	data = "" + data;
	for(var i = 0; i < data.length; i++)
		r += ("0" + data.charCodeAt(i).toString(16)).slice(-2);

	return r;
}

coomanPlus.getHash = function(str, type)
{
	type = typeof type == "undefined" || ["MD2", "MD5", "SHA1", "SHA256", "SHA384", "SHA512"].indexOf(type.toUpperCase()) == -1 ? "MD5" : type;
	var data;
	if (typeof str == "object")
		data = str;
	else
		data = this.strToArray(str);

	var ch = Cc["@mozilla.org/security/hash;1"]
						.createInstance(Ci.nsICryptoHash);
	ch.initWithString(type);
	ch.update(data, data.length);
	return ch.finish(false);
}

/**
*
*  Javascript crc32
*  http://www.webtoolkit.info/
*
**/

coomanPlus.crc32 = function(str) {

	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	};

	str = Utf8Encode(str);

	var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

	if (typeof(crc) == "undefined") { var crc = 0; }
	var x = 0;
	var y = 0;

	crc = crc ^ (-1);
	for( var i = 0, iTop = str.length; i < iTop; i++ ) {
		y = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
		x = "0x" + table.substr( y * 9, 8 );
		crc = ( crc >>> 8 ) ^ x;
	}

	return crc ^ (-1);

};