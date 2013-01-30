coomanPlus.prefTemplateClipboard = {value: "", extra: false}
coomanPlus.prefTemplateFile = {value: "", extra: false};
coomanPlus.prefBackupEncrypt = false;
coomanPlus.prefBackupFileName = "";
coomanPlus.backupTemplate = {value: "{HOST}	{ISDOMAIN_RAW}	{PATH}	{ISSECURE_RAW}	{EXPIRES_RAW}	{NAME}	{CONTENT}", extra: false};
//coomanPlus.encryptVersion = 2;
coomanPlus.encryptVersion = "Legacy";
coomanPlus.restoreVersion = "1.0";
coomanPlus.names = ["Cookies Manager+", "Cookie's Master"];
coomanPlus.namesRegExp = coomanPlus.names.escapeRegExp();
coomanPlus.exportGetData = function(t, s, a, u, j)
{
	j = typeof(j) == "undefined" ? "\r\n\r\n" : j;
	if (typeof(s) == "undefined")
		s = this.getTreeSelections(this._cookiesTree);

	if (!s.length)
		return false;

	if (typeof(a) == "undefined")
		a = this._cookies;

	var data = [];
	for(var i = 0; i < s.length; i++)
	{
		if (u)
			data.push(this.exportTemplate(a[s[i]], t).replace(/\ttrue/g, "\tTRUE").replace(/\tfalse/g, "\tFALSE"));
		else
			data.push(this.exportTemplate(a[s[i]], t));
	}
	data.sort();
	return data.join(j);
}

coomanPlus.exportClipboard = function()
{
	var data = this.exportGetData(this.prefTemplateClipboard, undefined, undefined, false, "");
	var str = Cc["@mozilla.org/supports-string;1"]
						.createInstance(Ci.nsISupportsString);
	str.data = data;
	var trans = Cc["@mozilla.org/widget/transferable;1"]
							.createInstance(Ci.nsITransferable);
	trans.addDataFlavor("text/unicode");
	trans.setTransferData("text/unicode", str, data.length * 2);
	var clip = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
	clip.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
	return;

	Cc["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Ci.nsIClipboardHelper)
	.copyString(str);
}

coomanPlus.exportFile = function()
{
	var s = this.getTreeSelections(this._cookiesTree);
	if (!s.length)
		return;

	var bundle = srGetStrBundle("chrome://pippki/locale/pippki.properties");
	if (s.length > 1)
	{
		var t = new Date();
		var filename = "cookies_"
										+ t.getFullYear()
										+ coomanPlus.right("00" + t.getMonth(), 2)
										+ coomanPlus.right("00" + t.getDate(), 2)
										+ coomanPlus.right("00" + t.getHours(), 2)
										+ coomanPlus.right("00" + t.getMinutes(), 2)
										+ coomanPlus.right("00" + t.getSeconds(), 2)
										+ ".txt";
	}
	else
		var filename = this._cookies[s[0]].rawHost + "_" + this._cookies[s[0]].name + ".txt";

	var fp = this.saveFileSelect(filename, "txt", "", null);
	if (!fp)
		return;

	var content = this.exportGetData(this.prefTemplateFile, undefined, undefined, false, "");
	if (!content.length)
		return;

	if (this.saveFile(fp, content))
	{
		if (this.confirm(this.string("export_success") + "\n" + this.string("export_openfolder"), this.string("export_success")))
			new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath")(fp.file.path).reveal();
	}
}

coomanPlus.exportTemplate = function(aCookie, t)
{
	var r = t.value;
	var tags = "NAME|CONTENT|CONTENT_RAW|HOST|PATH|ISSECURE|ISSECURE_RAW|EXPIRES|EXPIRES_RAW|POLICY|POLICY_RAW|ISDOMAIN|ISDOMAIN_RAW";
	var data = {
		NAME:					aCookie.name,
		CONTENT:			this._escape(aCookie.value, 12),
		CONTENT_RAW:	aCookie.value,
		HOST:					aCookie.host,
		PATH:					aCookie.path,
		ISSECURE:			aCookie.isSecure ? this.string("secureYes") : this.string("secureNo"),
		ISSECURE_RAW:	aCookie.isSecure,
		EXPIRES:			this.getExpiresString(aCookie.expires),
		EXPIRES_RAW:	aCookie.expires,
		POLICY:				this.string("policy"+aCookie.policy),
		POLICY_RAW:		aCookie.policy,
		ISDOMAIN:			this.string("yesno"+ (aCookie.isDomain ? 1 : 0)),
		ISDOMAIN_RAW:	aCookie.isDomain,
	}
	if (this.cookieCuller.enabled && this.prefCookieCuller)
	{
		tags += "|ISPROTECTED|ISPROTECTED_RAW";
		data.ISPROTECTED =			this.string("yesno"+ (aCookie.isProtected ? 1 : 0));
		data.ISPROTECTED_RAW =	aCookie.isProtected ? true : false;
	}
	if (t.extra)
	{
		tags += "|CREATIONTIME|CREATIONTIME_RAW|LASTACCESSED|LASTACCESSED_RAW|ISHTTPONLY|ISHTTPONLY_RAW|STATUS|STATUS_RAW";
		if (!aCookie.extra)
			aCookie = this._cookieGetExtraInfo(aCookie);

		data.CREATIONTIME =			this.getExpiresString(Math.round(aCookie.creationTime/1000000));
		data.CREATIONTIME_RAW =	aCookie.creationTime;
		data.LASTACCESSED =			this.getExpiresString(Math.round(aCookie.lastAccessed/1000000));
		data.LASTACCESSED_RAW =	aCookie.lastAccessed;
		data.ISHTTPONLY =				this.string('yesno' + (aCookie.isHttpOnly?1:0));
		data.ISHTTPONLY_RAW =		aCookie.isHttpOnly;
		data.STATUS =						this.string("status"+aCookie.status);
		data.STATUS_RAW =				aCookie.status;
	}
	r = r.replace(new RegExp("({(" + tags + ")})", "g"), function()
	{
		if (typeof(data[arguments[2]]) !== "undefined")
		{
			return data[arguments[2]];
		}
		return arguments[0];
	});
	return r;
}

coomanPlus.encryptFunc = function(v)
{
	if (typeof(v) == "undefined")
		v = this.encryptVersion;

	let func = "encrypt" + this.binToDec(String.fromCharCode(v));
	if (typeof(this[func]) != "function")
		func = "encryptLegacy";

	return this[func];
}
coomanPlus.decrypt = function(data, pass, crc, v)
{
	return this.encrypt(data, pass, crc, v);
}

coomanPlus.encrypt = function(data, pass, crc, v)
{

	return this.encryptFunc(v)(data, pass, crc);
}

coomanPlus.encryptData = function(data, password)
{
	//add two hashes: for unencrypted and encrypted data for integrity check
	var hash = this.getHash(data),
			e = this.encryptFunc(this.encryptVersion)(hash + data, password);
			hashe = this.getHash(e);
//	return md5 + md5e + e;
	return "#encrypted" + String.fromCharCode(this.encryptVersion) + hashe + e;
}

coomanPlus.encryptLegacy = function(data, pass, crc)
{
	pass = coomanPlus.Base64.encode(pass); //work around some issues when used non-ASCII characters
	var n = 0, r = "", i;

	if (typeof data == "object")
		data = data[0];

	for(i = 0; i < data.length; i++)
	{
		r += String.fromCharCode(data.charCodeAt(i) ^ pass.charCodeAt(n));
		if (++n >= pass.length)
			n = 0;
	}
	if (crc && crc != coomanPlus.binToHex(coomanPlus.getHash(r)))
		return null;

	return r;
}

coomanPlus.encrypt002 = function(data, pass, crc)
{
/*
	var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
			createInstance(Ci.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	pass = converter.convertToByteArray(pass);
*/
	pass = this.strToArray(pass);
	pass.i = -1;

	if (typeof data == "object")
		data = data[1];
	else
		data = this.strToArray(data);

	var i = 0, b = 0, r = "", st, passHash = this.stringToBytes(this.getHash(pass, "SHA512")), byte;
	passHash.i = -1;
	for(i = 0; i < data.length; i++)
	{
		byte = data[i];
		byte ^= pass.length;
		byte ^= this.arrayLoop(passHash);
		byte ^= this.arrayLoop(pass);
		r += String.fromCharCode(byte);
		this.dump([this.binToHex(this.binToStr(data[i])), this.binToHex(this.binToStr(byte))]);
	}
	this.dump(r);
	if (crc)
	{
		if (crc !== true && crc != this.binToHex(this.getHash(r)))
			return null;

		crc = this.binToHex(this.readBytes(r, 0, 16));
		r = this.readBytes(r, 16);
		if (crc != this.binToHex(this.getHash(r)))
			return null;
	}

	return r;
}

coomanPlus.backupAll = function(sel)
{
	var file = this.getFilename(sel, this.prefBackupFileName);
	var a = this._cookiesAll, l = [];
	if (sel)
	{
		l = sel[0];
		a = sel[1];
	}
	else
	{
		for(var i = 0; i < this._cookiesAll.length; i++)
			l.push(i);
	}
	var t = this.clone(this.backupTemplate);
	if (this.cookieCuller.enabled && this.prefCookieCuller)
		t.value += "	{ISPROTECTED_RAW}";

	var data = this.exportGetData(t, l, a, true);
	if (!data.length)
		return false;

	if (this.prefBackupEncrypt)
	{
		var password = this.promptPassword(null, null, true);
		if (password)
		{
			data = this.encryptData(data, password);
		}
		else if (password === null)
			return false;
	}

	var fp = this.saveFileSelect(file, "txt", "", null);
	if (!fp)
		return false;

	if (this.saveFile(fp, this.exportGetHeader() + data))
	{
		if (this.confirm(this.string("export_success") + "\n" + this.string("export_openfolder"), this.string("export_success")))
			new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath")(fp.file.path).reveal();
	}
	return false;
}

coomanPlus.backupAddPassword = function()
{
	var file = this.restoreOpen(true);
	if (!file)
	{
		this.alert(this.string("restore_file_open_error"));
		return;
	}
	if (file[4])
	{
		this.alert(this.string("backup_already_encrypted"));
		return;
	}
	var b = this.prefBackupEncrypt;
	this.prefBackupEncrypt = true;
	var data = file[5];

	if (!data.length)
		return;

	var reg = new RegExp("^(#Created by (" + this.namesRegExp.join("|") + ").*)$", "m");
	data = data.replace(reg, "").trim();

	var password = this.promptPassword(null, null, true, true);
	if (password)
	{
		data = this.encryptData(data, password);
	}
	else
	{
//		this.alert(this.string("password_notset"));
		return;
	}
	var l = reg.exec(file[3]),
			h;

	if (l)
		h = l[1] + "\r\n\r\n";
	else
		h = this.exportGetHeader();

	var fp = this.saveFileSelect(file[2].file.leafName, "txt", file[2].displayDirectory, null);
	if (!fp)
	{
		this.alert(this.string("password_notset"))
		return;
	}

	if (this.saveFile(fp, h + data))
		if (this.confirm(this.string("password_set") + "\n" + this.string("export_openfolder"), this.string("password_set")))
			new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath")(fp.file.path).reveal();
}

coomanPlus.backupRemovePassword = function()
{
	var file = this.restoreOpen();
	if (file)
	{
		switch(file[0])
		{
			case "canceled":
				return;
		}
		if (!file[4])
		{
			this.alert(this.string("backup_notencrypted"))
			return;
		}
	}
	else
		return;

	var data = file[5];
	if (!data)
		return;


	let str = "#encrypted" + file[4][1];
	let pos = file[3].indexOf(str);
	if (pos == -1)
	{
		str = "#encrypted" + file[4][4] + file[4][3];
		pos = file[3].indexOf(str);
	}
	if (pos == -1)
		pos = 0;

	var fp = this.saveFileSelect(file[2].file.leafName, "txt", file[2].displayDirectory, null);
	if (!fp)
	{
//		this.alert(this.string("backup_decrypt_failed"))
		return;
	}
	if (this.saveFile(fp, file[3].substring(0, pos) + data))
	{
		if (this.confirm(this.string("backup_decrypt_success") + "\n" + this.string("export_openfolder"), this.string("backup_decrypt_success")))
			new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath")(fp.file.path).reveal();
	}
}

coomanPlus.restoreSelected = function()
{
	this.restoreAll(true);
}

coomanPlus.restoreAll = function(sel)
{
	if (sel && this._selected.length == 0)
		return;

	var data = this.restoreOpen(false, this.string("restore_file_open" + (sel ? "_selected" : "")));
	if (!data || !data[1])
		return;

	var cookies = data[1],
			reg = new RegExp("#Created by (" + this.namesRegExp.join("|") + ") v([a-zA-Z0-9.]+)"),
			version = data[3].match(reg);

	this.restoreVersion = version ? version[2] : "1.0";

	this._noObserve = true;
	var num = 0,
			selected = [],
			value = "",
			compare = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator).compare,
			c = {
				v16a: compare(this.restoreVersion, "1.6a") >= 0,
			};
	for(var i = 0; i < cookies.length; i++)
	{
		if (!sel || this._isSelected(cookies[i]))
		{
			value = cookies[i].value;
			if (c.v16a)
				value = this._unescape(value, 12);

			coomanPlusCommon._cm2.add(cookies[i].host,
										cookies[i].path,
										cookies[i].name,
										value,
										cookies[i].isSecure,
										cookies[i].isHttpOnly,
										(cookies[i].expires) ? false : true,
										cookies[i].expires || Math.round((new Date()).getTime() / 1000 + 9999999999)
			);
			if (cookies[i].isProtected !== null && this.cookieCuller.enabled && this.prefCookieCuller)
				this.cookieCuller[cookies[i].isProtected ? "protect" : "unprotect"](cookies[i]);

			selected.push(cookies[i]);
			num++;
		}
	}
	this._noObserve = false;
	this.loadCookies();
	this._selected = selected
	this._cookiesTree.treeBoxObject.view.selection.currentIndex = -1;
	this.selectLastCookie();
	if (num > 0)
		this.alert(this.string("restore_success").replace("#", num))
	else
		this.alert(this.string("restore_none"))
}

coomanPlus.restoreOpen = function(nopass, title)
{
	if (typeof(title) == "undefined")
		title = this.string("restore_file_open");

	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	fp.init(window, title, nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
	var rv = fp.show();
	if (rv != nsIFilePicker.returnOK)
		return ["canceled"];


	var istream = Cc["@mozilla.org/network/file-input-stream;1"].
								createInstance(Ci.nsIFileInputStream),
			bstream = Cc["@mozilla.org/binaryinputstream;1"].
								createInstance(Ci.nsIBinaryInputStream);

	istream.init(fp.file, -1, -1, false);
	bstream.setInputStream(istream);
	var fileData = bstream.readBytes(bstream.available());
	bstream.close();
	istream.close();
	var data = fileData;
	var encrypted = /^#encrypted(([0-9a-f]{32})([0-9a-f]{32}))?/m.exec(data);
	if (encrypted)
	{
		encrypted.forEach(function(a, b, c) c[b] = c[b] || "")
		encrypted.push("");
		if (nopass)
		{
			return ["encrypted", null, fp, fileData, encrypted];
		}
		let str = "#encrypted" + encrypted[1],
				pos = data.indexOf(str),
				hash;
		if (encrypted[1] == "")
		{
			let start = pos + str.length;
			encrypted[2] = true;
			encrypted[3] = this.readBytes(data, start + 1, 16);
			encrypted[4] = this.readBytes(data, start, 1);
			data = this.readBytes(data, start + 17);
			hash = this.binToHex(this.binToStr(encrypted[3]));
		}
		else
		{
			data = data.substring(pos + str.length, data.length);
			hash = encrypted[3];
		}
		if (this.binToHex(this.getHash(data)) != hash)
		{
			this.alert(this.string("backup_corrupted"));
			return false;
		}
		istream.init(fp.file, -1, -1, false);
		bstream.setInputStream(istream);
		var fileDataArray = bstream.readByteArray(bstream.available());
		bstream.close();
		istream.close();
		fileDataArray.splice(0, pos + str.length);
		var r = true, msg;
		while(1)
		{
			var password = this.promptPassword(msg, this.string("backup_protected"));
			if (password !== null)
			{
				let d = this.decrypt([data, fileDataArray], password, encrypted[2], this.binToDec(encrypted[4]));
				if (d !== null)
				{
					data = d;
					break;
				}
				msg = this.string("password_incorrect");
			}
			else
			{
				return false;
			}
		}
	}
	if (!data)
		return false;

	var lines = data.split("\r\n"),
			cookies = [];
	for (var i = 0; i < lines.length; i++)
	{
		var line = lines[i];
		if (line.length > 10 && line.match(/^[^#\s]/))
		{
			var s = line.split("\t");
			if (s.length < 7)
				continue;

			cookies.push(new this.cookieObject({
				host: s[0],
				name: s[5],
				path: s[2],
				value: s[6],
				expires: parseInt(s[4]),
				isSecure: s[3].toUpperCase() == "TRUE",
				isDomain: s[1].toUpperCase() == "TRUE",
				policy: 0
			}));
			cookies[cookies.length-1].isProtected = typeof(s[s.length-1]) == "undefined" ? null : s[s.length-1].toUpperCase() == "TRUE";
		}
	}
	return [false, cookies, fp, fileData, encrypted, data];
}

coomanPlus.saveFileSelect = function(filename, ext, dir, title)
{
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	fp.init(window, title, nsIFilePicker.modeSave);
	if (dir)
		fp.displayDirectory = dir;

	fp.defaultString = filename.replace(/\s*/g, '');
	fp.defaultExtension = ext;
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
	var rv = fp.show();
	if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace)
		return false;

	return fp;
}

coomanPlus.promptPassword = function(msg, title, newPass, set)
{
	var r = {return: null, msg: msg, title: title, newPass: newPass, set: set};
	this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen," + (this.isMac ? "dialog=no" : "modal"), r);
	return r.return;
}

coomanPlus.arrayLoop = function(array)
{
	if (!("i" in array))
		array.i = -1;

	if (++array.i >= array.length)
		array.i = 0;

	return array[array.i];
}

coomanPlus.stringToBytes = function ( str )
{
	
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

coomanPlus.readBytes = function(data, start, num)
{
	num = typeof num == "undefined" ? data.length - start : num;
	var i, r = "", end = start + num;
	for(i = start; i < end; i++)
		r += String.fromCharCode(data.charCodeAt(i));

	return r;
}

coomanPlus.backupSelected = function()
{
	var l = [];
	var s = this.getTreeSelections(this._cookiesTree);
	this.backupAll([s, this._cookies]);
}

coomanPlus.getFilename = function(sel, file)
{
	var t = new Date(),
			date = t.getFullYear()
							+ coomanPlus.right("00" + t.getMonth(), 2)
							+ coomanPlus.right("00" + t.getDate(), 2)
							+ coomanPlus.right("00" + t.getHours(), 2)
							+ coomanPlus.right("00" + t.getMinutes(), 2)
							+ coomanPlus.right("00" + t.getSeconds(), 2);
	if (file)
		file = file.replace("#", date);
	else
		file = "backup_cookies_" + (sel ? "" : "all_")
						+ date
						+ ".txt";
	return file;
}

coomanPlus.exportGetHeader = function()
{
	return "#Created by " + this.names[0] + " v" + this.app.version + " on " + Date() + "\r\n\r\n";
}

coomanPlus.binToStr = function(data)
{
	var r = "";
	data = "" + data;
	for(var i = 0; i < data.length; i++)
		r += String.fromCharCode(data.charCodeAt(i));

	return r;
}

coomanPlus.binToDec = function(data)
{
	var r = "";
	data = "" + data;
	for(var i = 0; i < data.length; i++)
		r += ("00" + data.charCodeAt(i).toString(10)).slice(-3);

	return r;
}
