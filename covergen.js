var covergen = {

	json: null,
	jsonsrc: null,
	posturl: null,

	dom: {},
	_json: null,
	template: 0,
	element: 0,
	maintab: true,
	width: 0,
	height: 0,
	fields: [],
	ms: { mv: false, x: NaN, y: NaN },
	ie: NaN,

	fixev: function(ev) {
		ev = ev || window.event;
		return { ev: ev, src: ev.srcElement || ev.target,
			x: ev.clientX, y: ev.clientY };
	},

	setev: function(obj, ev, fn, set) {

		set = set ? 0 : 1;

		if(obj.addEventListener) {
			obj[['add','remove'][set] + 'EventListener'](ev, fn, false);
		} else {
			if(obj.attachEvent) {
				obj[['at','de'][set] + 'tachEvent']('on' + ev, fn);
			}
		}
	},

	showdef: function() {
		covergen.dom.def.value =
			covergen.dump(covergen.json[covergen.template]) + '\n';
	},

	tabsw: function(ev) {

		var mt = ((ev = covergen.fixev(ev)).src === covergen.dom.edtbtn);
		if(mt == covergen.maintab) return;
		covergen.maintab = mt;

		var dom = covergen.dom, n = dom[mt ? 'defbtn' : 'edtbtn'];

		ev.src.className = n.className;
		n.className = '';

		if(!mt && covergen.json && covergen.json.length) {
			covergen.showdef();
		}

		dom.edit.style.display = dom.text.style.display =
			dom.ecbl.style.display = (mt ? '' : 'none');

		dom.def.style.display =	dom.submit.style.display =
			dom.ttbl.style.display = (mt ? '' : 'block');
	},

	dump: function(obj, fm) {

		if(typeof obj != 'object' || obj === null) {

			if(typeof obj != 'string') return String(obj);

			return ('"' + obj.replace(/\\/g, '\\\\').replace(/\"/g, '\\"')
				.replace(/\t/g, '\\t').replace(/\n/g, '\\n')
				.replace(/[\u0000-\u001f]/g, '') + '"');
		}

		var _fm = (fm || '\n');
		fm = _fm + '    ';

		var data = [], a = (obj.constructor == Array), i;

		for(i in obj) {
			data.push((a ? '' : '"' + i + '": ')
				+ covergen.dump(obj[i], fm));
		}

		return ((a ? '[' : '{') + fm +
			data.join(',' + fm) + _fm  + (a ? ']' : '}'));
	},

	setx: function(x, obj) {
		x = covergen.fixnum(x, 0, covergen.width);
		(obj || covergen.fields[covergen.element]).style.left = x + 'px';
		return x;
	},

	sety: function(y, obj) {
		y = covergen.fixnum(y, 0, covergen.height);
		(obj || covergen.fields[covergen.element]).style.top = y + 'px';
		return y;
	},

	setfsz: function(p, obj) {
		p = covergen.fixnum(p, 1, covergen.height);
		var s = (obj || covergen.fields[covergen.element]).style;
		s.fontSize = s.lineHeight = p + 'pt';
		return p;
	},

	fixnum: function(n, min, max) {
		if(isNaN(n = parseInt(n)) || n < min) n = min;
		return ((n > max) ? max : n);
	},

	elsetup: function(n) {

		var hs = covergen.json[covergen.template].hotspots[n];
		var dom = covergen.dom;

		if(!hs) return;

		covergen.fields[covergen.element].style.zIndex = '';
		covergen.fields[covergen.element].style.outlineStyle = '';

		covergen.element = n;

		dom.posx.value = covergen.setx(hs.x);
		dom.posx.max = covergen.width;
		dom.posy.value = covergen.sety(hs.y);
		dom.posy.max = dom.font.max = covergen.height;
		dom.font.value = covergen.setfsz(hs['font-size']);

		dom.text.value = covergen.fields[n].firstChild.nodeValue =
			((covergen.ie < 8) ? hs.text.replace(/\r*\n/g, '\r\n') : hs.text);

		if(hs.text === covergen._json[covergen.template].hotspots[n].text)
			dom.text.select();

		covergen.fields[n].style.zIndex = 30;
		covergen.fields[n].style.outlineStyle = 'dashed';
	},

	setsel: function(sel, arr, m, alt) {

		sel.innerHTML = '';
		if(!arr) return;

		for(var n, i = 0; i < arr.length; i++) {
			n = document.createElement('OPTION');
			n.innerHTML = (arr[i][m] || arr[i][alt || m] || ('#' + (i + 1)));
			sel.appendChild(n);
		}
	},

	msup: function() {

		covergen.dom.cover.onmousemove = null;
		covergen.setev(document, 'mouseup', covergen.msup, false);

		if(covergen.ie && covergen.dom.cover.releaseCapture) {
			covergen.dom.cover.releaseCapture();
		}

		covergen.ms = { mv: false, x: NaN, y: NaN };
		covergen.dom.cover.style.cursor = 'auto';
	},

	msmv: function(ev) {

		ev = covergen.fixev(ev);
		var ms = covergen.ms;

		if(covergen.ie && ev.src !== covergen.dom.cover
			&& ev.src.parentNode !== covergen.dom.cover) {
			covergen.dom.cover.style.cursor = 'auto';
			return;
		}

		if(!ms.mv && Math.abs(ms.x - ev.x) < 4
			&& Math.abs(ms.y - ev.y) < 4) return;

		var s = covergen.fields[covergen.element].style;
		var hs = covergen.json[covergen.template].hotspots[covergen.element];

		hs.x = covergen.dom.posx.value =
			covergen.setx((parseInt(s.left) || 0) - (ms.x - ev.x));
		hs.y = covergen.dom.posy.value =
			covergen.sety((parseInt(s.top) || 0) - (ms.y - ev.y));

		covergen.ms = { mv: true, x: ev.x, y: ev.y };
		covergen.dom.cover.style.cursor = 'move';
	},

	tpsetup: function(n) {

		var tp = covergen.json[n], dom = covergen.dom;
		if(!tp) return;

		covergen.template = n;
		covergen.element = 0;
		dom.cover.innerHTML = '';
		covergen.fields = [];

		covergen.setsel(dom.elsel, covergen._json[n].hotspots,
			'text', 'element');

		dom.cover.style.width =
			(covergen.width = covergen.fixnum(tp.width, 0, 600)) + 'px';
		dom.cover.style.height =
			(covergen.height = covergen.fixnum(tp.height, 0, 600)) + 'px';

		dom.cover.style.backgroundImage =
			'url("' + tp['cover-template'] + '")';

		if(covergen.ie < 8) {
			dom.cover.style.marginTop =
				~~((620 - covergen.height) / 2) + 'px';
		}

		for(var i in tp.hotspots) {

			var hs = tp.hotspots[i];
			var n = document.createElement('DIV'), s = n.style;

			n.className = 'covergen-css-field';
			n.setAttribute('covergenid', i, 0);
			n.unselectable = 'on';

			s.fontFamily = hs['font-name'];
			s.color = s.outlineColor = hs['font-color'];
			s.maxWidth = covergen.width + 'px';
			s.maxHeight = covergen.height + 'px';

			if(i) {
				covergen.setx(hs.x, n);
				covergen.sety(hs.y, n);
				covergen.setfsz(hs['font-size'], n);
			}

			n.appendChild(document
				.createTextNode((i && hs.text) ? hs.text : ''));

			dom.cover.appendChild(n);

			n.onmousedown = function(ev) {

				ev = covergen.fixev(ev);
				var i = ev.src.getAttribute('covergenid', 0);

				if(covergen.dom.elsel.selectedIndex != i) {
					covergen.dom.elsel.selectedIndex = i;
					covergen.dom.elsel.onchange();
				}

				covergen.ms = { mv: false, x: ev.x, y: ev.y };

				covergen.dom.cover.onmousemove = covergen.msmv;
				covergen.setev(document, 'mouseup', covergen.msup, true);

				if(covergen.ie && covergen.dom.cover.setCapture) {
					covergen.dom.cover.setCapture();
				}

				return false;
			};

			covergen.fields[i] = n;
		}

		covergen.elsetup(0);
	},

	query: function(url, callback, data) {

		var req = null;

		try { req = new XMLHttpRequest(); }
		catch(e) {
			try { req = new ActiveXObject('Microsoft.XMLHTTP'); }
			catch(e) {
				try { req = new ActiveXObject('Msxml2.XMLHTTP'); }
				catch(e) {
					alert('HTTP Request Object Error.');
				}
			}
		}

		if(!req) return;

		req.open(data ? 'POST' : 'GET', url, true);

		req.onreadystatechange = function() {
			if(req.readyState == 4) {
				callback((req.status == 200) ? req.responseText
					: null, req.status);
				req.onreadystatechange = null;
				req = null;
			}
		};

		try { req.send(data || null); }
		catch(e) { alert('HTTP Request Error (' + e + ').'); }
	},

	clone: function(obj) {

		if(typeof obj != 'object' || obj === null) return obj;

		var _obj = obj.constructor();

		for(var i in obj) {
			_obj[i] = covergen.clone(obj[i]);
		}

		return _obj;
	},

	inupd: function(a, b, c) {
		covergen.json[covergen.template].hotspots[covergen.element][a]
			= covergen.dom[b].value = covergen[c](covergen.dom[b].value);
	},

	oninput: function(obj, fn) {

		obj.onblur = fn;

		if(typeof oninput != 'undefined') {
			obj.oninput = fn;
		} else {
			obj.onchange = obj.onkeyup = fn;
		}
	},

	jsinit: function() {

		if(!covergen.json || !covergen.json.length) return;

		covergen._json = covergen.clone(covergen.json);
		var dom = covergen.dom;

		covergen.setsel(dom.tpsel, covergen.json, 'imprint');
		covergen.tpsetup(0);

		dom.tpsel.onchange = function() {
			covergen.tpsetup(covergen.dom.tpsel.selectedIndex);
			if(!covergen.maintab) covergen.showdef();
		};

		dom.tprl.onclick = function() {
			var i = covergen.template;
			covergen.json[i] = covergen.clone(covergen._json[i]);
			covergen.tpsetup(i);
			if(!covergen.maintab) covergen.showdef();
		};

		dom.elsel.onchange = function() {
			covergen.elsetup(covergen.dom.elsel.selectedIndex);
		};

		dom.elrl.onclick = function() {
			var i = covergen.element, t = covergen.template;
			covergen.json[t].hotspots[i] =
				covergen.clone(covergen._json[t].hotspots[i]);
			covergen.elsetup(i);
		};

		covergen.oninput(dom.text, function() {
			var i = covergen.element, v = covergen.dom.text.value;
			covergen.fields[i].firstChild.nodeValue
				= covergen.json[covergen.template].hotspots[i].text
				= ((covergen.ie < 8) ? v : v.replace(/\r/g, ''));
		});

		covergen.oninput(dom.posx, function() {
			covergen.inupd('x','posx','setx');
		});

		covergen.oninput(dom.posy, function() {
			covergen.inupd('y','posy','sety');
		});

		covergen.oninput(dom.font, function() {
			covergen.inupd('font-size','font','setfsz');
		});

		dom.submit.onclick = function() {
			dom.form.submit();
		}

		dom.lmsg.style.display = 'none';
	},

	init: function() {

		if(covergen.dom.root || !(covergen.dom.root =
			document.getElementById('covergen-dom'))) return;

		var a = covergen.dom.root.getElementsByTagName('*');
		var r = /covergen-dom-(\w+)/, i = 0;

		for(; i < a.length; i++) {
			if(a[i].id.search(r) == 0) covergen.dom[RegExp.$1] = a[i];
		}

		covergen.ie = parseInt((navigator.userAgent
			.match(/MSIE (\d+)/) || [])[1]);

		if(covergen.posturl) {
			covergen.dom.form.action = covergen.posturl;
		}

		covergen.dom.edtbtn.onclick =
			covergen.dom.defbtn.onclick = covergen.tabsw;

		if(covergen.jsonsrc && !covergen.json) {
			covergen.query(covergen.jsonsrc, function(res, stc) {
				if(res) {
					try { covergen.json = eval('(' + res + ')'); }
					catch(e) { alert('JSON Error (' + e + ').'); }
					covergen.jsinit();
				} else {
					alert('HTTP Error (' + stc + ').');
				}
			});
		} else {
			covergen.jsinit();
		}
	}
};

if(!covergen.jsonsrc || !covergen.posturl) {

	var a = document.getElementsByTagName('SCRIPT');

	if(!covergen.jsonsrc) {
		covergen.jsonsrc = a[a.length - 1].getAttribute('jsonsrc', 0);
	}

	if(!covergen.posturl) {
		covergen.posturl = a[a.length - 1].getAttribute('posturl', 0);
	}
}

covergen.setev(window, 'load', covergen.init, true);
covergen.setev(window, 'DOMContentLoaded', covergen.init, true);
covergen.setev(document, 'load', covergen.init, true);
