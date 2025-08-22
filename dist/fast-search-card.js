(function() {
  "use strict";
  var n, l$1, u$2, i$1, r$1, o$1, e$1, f$2, c$1, s$1, a$1, h$1, p$1 = {}, v$1 = [], y$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, w$2 = Array.isArray;
  function d$1(n2, l2) {
    for (var u2 in l2) n2[u2] = l2[u2];
    return n2;
  }
  function g$2(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _$1(l2, u2, t2) {
    var i2, r2, o2, e2 = {};
    for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
    return m$1(l2, e2, i2, r2, null);
  }
  function m$1(n2, t2, i2, r2, o2) {
    var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u$2 : o2, __i: -1, __u: 0 };
    return null == o2 && null != l$1.vnode && l$1.vnode(e2), e2;
  }
  function b$1() {
    return { current: null };
  }
  function k$2(n2) {
    return n2.children;
  }
  function x$2(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function S(n2, l2) {
    if (null == l2) return n2.__ ? S(n2.__, n2.__i + 1) : null;
    for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
    return "function" == typeof n2.type ? S(n2) : null;
  }
  function C$2(n2) {
    var l2, u2;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) {
        n2.__e = n2.__c.base = u2.__e;
        break;
      }
      return C$2(n2);
    }
  }
  function M$1(n2) {
    (!n2.__d && (n2.__d = true) && i$1.push(n2) && !$$1.__r++ || r$1 != l$1.debounceRendering) && ((r$1 = l$1.debounceRendering) || o$1)($$1);
  }
  function $$1() {
    for (var n2, u2, t2, r2, o2, f2, c2, s2 = 1; i$1.length; ) i$1.length > s2 && i$1.sort(e$1), n2 = i$1.shift(), s2 = i$1.length, n2.__d && (t2 = void 0, o2 = (r2 = (u2 = n2).__v).__e, f2 = [], c2 = [], u2.__P && ((t2 = d$1({}, r2)).__v = r2.__v + 1, l$1.vnode && l$1.vnode(t2), O$1(u2.__P, t2, r2, u2.__n, u2.__P.namespaceURI, 32 & r2.__u ? [o2] : null, f2, null == o2 ? S(r2) : o2, !!(32 & r2.__u), c2), t2.__v = r2.__v, t2.__.__k[t2.__i] = t2, N$1(f2, t2, c2), t2.__e != o2 && C$2(t2)));
    $$1.__r = 0;
  }
  function I$1(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, y2, w2, d2, g2, _2, m2 = t2 && t2.__k || v$1, b2 = l2.length;
    for (f2 = P$2(u2, l2, m2, f2, b2), a2 = 0; a2 < b2; a2++) null != (y2 = u2.__k[a2]) && (h2 = -1 == y2.__i ? p$1 : m2[y2.__i] || p$1, y2.__i = a2, g2 = O$1(n2, y2, h2, i2, r2, o2, e2, f2, c2, s2), w2 = y2.__e, y2.ref && h2.ref != y2.ref && (h2.ref && B$2(h2.ref, null, y2), s2.push(y2.ref, y2.__c || w2, y2)), null == d2 && null != w2 && (d2 = w2), (_2 = !!(4 & y2.__u)) || h2.__k === y2.__k ? f2 = A$2(y2, f2, n2, _2) : "function" == typeof y2.type && void 0 !== g2 ? f2 = g2 : w2 && (f2 = w2.nextSibling), y2.__u &= -7);
    return u2.__e = d2, f2;
  }
  function P$2(n2, l2, u2, t2, i2) {
    var r2, o2, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
    for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? (f2 = r2 + h2, (o2 = n2.__k[r2] = "string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? m$1(null, o2, null, null, null) : w$2(o2) ? m$1(k$2, { children: o2 }, null, null, null) : null == o2.constructor && o2.__b > 0 ? m$1(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : o2).__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = L$1(o2, u2, f2, a2)) && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > s2 ? h2-- : i2 < s2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
    if (a2) for (r2 = 0; r2 < s2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = S(e2)), D$2(e2, e2));
    return t2;
  }
  function A$2(n2, l2, u2, t2) {
    var i2, r2;
    if ("function" == typeof n2.type) {
      for (i2 = n2.__k, r2 = 0; i2 && r2 < i2.length; r2++) i2[r2] && (i2[r2].__ = n2, l2 = A$2(i2[r2], l2, u2, t2));
      return l2;
    }
    n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = S(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
    do {
      l2 = l2 && l2.nextSibling;
    } while (null != l2 && 8 == l2.nodeType);
    return l2;
  }
  function H$1(n2, l2) {
    return l2 = l2 || [], null == n2 || "boolean" == typeof n2 || (w$2(n2) ? n2.some(function(n3) {
      H$1(n3, l2);
    }) : l2.push(n2)), l2;
  }
  function L$1(n2, l2, u2, t2) {
    var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], s2 = null != c2 && 0 == (2 & c2.__u);
    if (null === c2 && null == n2.key || s2 && e2 == c2.key && f2 == c2.type) return u2;
    if (t2 > (s2 ? 1 : 0)) {
      for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o2;
    }
    return -1;
  }
  function T$2(n2, l2, u2) {
    "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || y$1.test(l2) ? u2 : u2 + "px";
  }
  function j$2(n2, l2, u2, t2, i2) {
    var r2, o2;
    n: if ("style" == l2) if ("string" == typeof u2) n2.style.cssText = u2;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || T$2(n2.style, l2, "");
      if (u2) for (l2 in u2) t2 && u2[l2] == t2[l2] || T$2(n2.style, l2, u2[l2]);
    }
    else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f$2, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2.u = t2.u : (u2.u = c$1, n2.addEventListener(l2, r2 ? a$1 : s$1, r2)) : n2.removeEventListener(l2, r2 ? a$1 : s$1, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
        n2[l2] = null == u2 ? "" : u2;
        break n;
      } catch (n3) {
      }
      "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
    }
  }
  function F$2(n2) {
    return function(u2) {
      if (this.l) {
        var t2 = this.l[u2.type + n2];
        if (null == u2.t) u2.t = c$1++;
        else if (u2.t < t2.u) return;
        return t2(l$1.event ? l$1.event(u2) : u2);
      }
    };
  }
  function O$1(n2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, p2, v2, y2, _2, m2, b2, S2, C2, M2, $2, P2, A2, H2, L2, T2, j2 = u2.type;
    if (null != u2.constructor) return null;
    128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (a2 = l$1.__b) && a2(u2);
    n: if ("function" == typeof j2) try {
      if (b2 = u2.props, S2 = "prototype" in j2 && j2.prototype.render, C2 = (a2 = j2.contextType) && i2[a2.__c], M2 = a2 ? C2 ? C2.props.value : a2.__ : i2, t2.__c ? m2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (S2 ? u2.__c = h2 = new j2(b2, M2) : (u2.__c = h2 = new x$2(b2, M2), h2.constructor = j2, h2.render = E$1), C2 && C2.sub(h2), h2.props = b2, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != j2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = d$1({}, h2.__s)), d$1(h2.__s, j2.getDerivedStateFromProps(b2, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2) S2 && null == j2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
      else {
        if (S2 && null == j2.getDerivedStateFromProps && b2 !== v2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b2, M2), !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b2, h2.__s, M2) || u2.__v == t2.__v) {
          for (u2.__v != t2.__v && (h2.props = b2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
            n3 && (n3.__ = u2);
          }), $2 = 0; $2 < h2._sb.length; $2++) h2.__h.push(h2._sb[$2]);
          h2._sb = [], h2.__h.length && e2.push(h2);
          break n;
        }
        null != h2.componentWillUpdate && h2.componentWillUpdate(b2, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
          h2.componentDidUpdate(v2, y2, _2);
        });
      }
      if (h2.context = M2, h2.props = b2, h2.__P = n2, h2.__e = false, P2 = l$1.__r, A2 = 0, S2) {
        for (h2.state = h2.__s, h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), H2 = 0; H2 < h2._sb.length; H2++) h2.__h.push(h2._sb[H2]);
        h2._sb = [];
      } else do {
        h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
      } while (h2.__d && ++A2 < 25);
      h2.state = h2.__s, null != h2.getChildContext && (i2 = d$1(d$1({}, i2), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(v2, y2)), L2 = a2, null != a2 && a2.type === k$2 && null == a2.key && (L2 = V$1(a2.props.children)), f2 = I$1(n2, w$2(L2) ? L2 : [L2], u2, t2, i2, r2, o2, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), m2 && (h2.__E = h2.__ = null);
    } catch (n3) {
      if (u2.__v = null, c2 || null != o2) if (n3.then) {
        for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
        o2[o2.indexOf(f2)] = null, u2.__e = f2;
      } else {
        for (T2 = o2.length; T2--; ) g$2(o2[T2]);
        z$2(u2);
      }
      else u2.__e = t2.__e, u2.__k = t2.__k, n3.then || z$2(u2);
      l$1.__e(n3, u2, t2);
    }
    else null == o2 && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = q$2(t2.__e, u2, t2, i2, r2, o2, e2, c2, s2);
    return (a2 = l$1.diffed) && a2(u2), 128 & u2.__u ? void 0 : f2;
  }
  function z$2(n2) {
    n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z$2);
  }
  function N$1(n2, u2, t2) {
    for (var i2 = 0; i2 < t2.length; i2++) B$2(t2[i2], t2[++i2], t2[++i2]);
    l$1.__c && l$1.__c(u2, n2), n2.some(function(u3) {
      try {
        n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
          n3.call(u3);
        });
      } catch (n3) {
        l$1.__e(n3, u3.__v);
      }
    });
  }
  function V$1(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w$2(n2) ? n2.map(V$1) : d$1({}, n2);
  }
  function q$2(u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, v2, y2, d2, _2, m2, b2 = i2.props, k2 = t2.props, x2 = t2.type;
    if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (a2 = 0; a2 < e2.length; a2++) if ((d2 = e2[a2]) && "setAttribute" in d2 == !!x2 && (x2 ? d2.localName == x2 : 3 == d2.nodeType)) {
        u2 = d2, e2[a2] = null;
        break;
      }
    }
    if (null == u2) {
      if (null == x2) return document.createTextNode(k2);
      u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l$1.__m && l$1.__m(t2, e2), c2 = false), e2 = null;
    }
    if (null == x2) b2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
    else {
      if (e2 = e2 && n.call(u2.childNodes), b2 = i2.props || p$1, !c2 && null != e2) for (b2 = {}, a2 = 0; a2 < u2.attributes.length; a2++) b2[(d2 = u2.attributes[a2]).name] = d2.value;
      for (a2 in b2) if (d2 = b2[a2], "children" == a2) ;
      else if ("dangerouslySetInnerHTML" == a2) v2 = d2;
      else if (!(a2 in k2)) {
        if ("value" == a2 && "defaultValue" in k2 || "checked" == a2 && "defaultChecked" in k2) continue;
        j$2(u2, a2, null, d2, o2);
      }
      for (a2 in k2) d2 = k2[a2], "children" == a2 ? y2 = d2 : "dangerouslySetInnerHTML" == a2 ? h2 = d2 : "value" == a2 ? _2 = d2 : "checked" == a2 ? m2 = d2 : c2 && "function" != typeof d2 || b2[a2] === d2 || j$2(u2, a2, d2, b2[a2], o2);
      if (h2) c2 || v2 && (h2.__html == v2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
      else if (v2 && (u2.innerHTML = ""), I$1("template" == t2.type ? u2.content : u2, w$2(y2) ? y2 : [y2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c2, s2), null != e2) for (a2 = e2.length; a2--; ) g$2(e2[a2]);
      c2 || (a2 = "value", "progress" == x2 && null == _2 ? u2.removeAttribute("value") : null != _2 && (_2 !== u2[a2] || "progress" == x2 && !_2 || "option" == x2 && _2 != b2[a2]) && j$2(u2, a2, _2, b2[a2], o2), a2 = "checked", null != m2 && m2 != u2[a2] && j$2(u2, a2, m2, b2[a2], o2));
    }
    return u2;
  }
  function B$2(n2, u2, t2) {
    try {
      if ("function" == typeof n2) {
        var i2 = "function" == typeof n2.__u;
        i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
      } else n2.current = u2;
    } catch (n3) {
      l$1.__e(n3, t2);
    }
  }
  function D$2(n2, u2, t2) {
    var i2, r2;
    if (l$1.unmount && l$1.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || B$2(i2, null, u2)), null != (i2 = n2.__c)) {
      if (i2.componentWillUnmount) try {
        i2.componentWillUnmount();
      } catch (n3) {
        l$1.__e(n3, u2);
      }
      i2.base = i2.__P = null;
    }
    if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && D$2(i2[r2], u2, t2 || "function" != typeof n2.type);
    t2 || g$2(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function E$1(n2, l2, u2) {
    return this.constructor(n2, u2);
  }
  function G$1(u2, t2, i2) {
    var r2, o2, e2, f2;
    t2 == document && (t2 = document.documentElement), l$1.__ && l$1.__(u2, t2), o2 = (r2 = "function" == typeof i2) ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], O$1(t2, u2 = (!r2 && i2 || t2).__k = _$1(k$2, null, [u2]), o2 || p$1, p$1, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f2), N$1(e2, u2, f2);
  }
  function J$1(n2, l2) {
    G$1(n2, l2, J$1);
  }
  function K$1(l2, u2, t2) {
    var i2, r2, o2, e2, f2 = d$1({}, l2.props);
    for (o2 in l2.type && l2.type.defaultProps && (e2 = l2.type.defaultProps), u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : f2[o2] = void 0 === u2[o2] && null != e2 ? e2[o2] : u2[o2];
    return arguments.length > 2 && (f2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), m$1(l2.type, f2, i2 || l2.key, r2 || l2.ref, null);
  }
  function Q$1(n2) {
    function l2(n3) {
      var u2, t2;
      return this.getChildContext || (u2 = /* @__PURE__ */ new Set(), (t2 = {})[l2.__c] = this, this.getChildContext = function() {
        return t2;
      }, this.componentWillUnmount = function() {
        u2 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value != n4.value && u2.forEach(function(n5) {
          n5.__e = true, M$1(n5);
        });
      }, this.sub = function(n4) {
        u2.add(n4);
        var l3 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u2 && u2.delete(n4), l3 && l3.call(n4);
        };
      }), n3.children;
    }
    return l2.__c = "__cC" + h$1++, l2.__ = n2, l2.Provider = l2.__l = (l2.Consumer = function(n3, l3) {
      return n3.children(l3);
    }).contextType = l2, l2;
  }
  n = v$1.slice, l$1 = { __e: function(n2, l2, u2, t2) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n2 = l3;
    }
    throw n2;
  } }, u$2 = 0, x$2.prototype.setState = function(n2, l2) {
    var u2;
    u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d$1({}, this.state), "function" == typeof n2 && (n2 = n2(d$1({}, u2), this.props)), n2 && d$1(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), M$1(this));
  }, x$2.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), M$1(this));
  }, x$2.prototype.render = k$2, i$1 = [], o$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n2, l2) {
    return n2.__v.__b - l2.__v.__b;
  }, $$1.__r = 0, f$2 = /(PointerCapture)$|Capture$/i, c$1 = 0, s$1 = F$2(false), a$1 = F$2(true), h$1 = 0;
  var f$1 = 0;
  function u$1(e2, t2, n2, o2, i2, u2) {
    t2 || (t2 = {});
    var a2, c2, p2 = t2;
    if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
    var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f$1, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
    return l$1.vnode && l$1.vnode(l2), l2;
  }
  const __vite_import_meta_env__$1 = {};
  const createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const destroy = () => {
      if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production") {
        console.warn(
          "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
        );
      }
      listeners.clear();
    };
    const api = { setState, getState, getInitialState, subscribe, destroy };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
  var t, r, u, i, o = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
  function p(n2, t2) {
    c.__h && c.__h(r, n2, o || t2), o = 0;
    var u2 = r.__H || (r.__H = { __: [], __h: [] });
    return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
  }
  function d(n2) {
    return o = 1, h(D$1, n2);
  }
  function h(n2, u2, i2) {
    var o2 = p(t++, 2);
    if (o2.t = n2, !o2.__c && (o2.__ = [i2 ? i2(u2) : D$1(void 0, u2), function(n3) {
      var t2 = o2.__N ? o2.__N[0] : o2.__[0], r2 = o2.t(t2, n3);
      t2 !== r2 && (o2.__N = [r2, o2.__[1]], o2.__c.setState({}));
    }], o2.__c = r, !r.__f)) {
      var f2 = function(n3, t2, r2) {
        if (!o2.__c.__H) return true;
        var u3 = o2.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u3.every(function(n4) {
          return !n4.__N;
        })) return !c2 || c2.call(this, n3, t2, r2);
        var i3 = o2.__c.props !== n3;
        return u3.forEach(function(n4) {
          if (n4.__N) {
            var t3 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t3 !== n4.__[0] && (i3 = true);
          }
        }), c2 && c2.call(this, n3, t2, r2) || i3;
      };
      r.__f = true;
      var c2 = r.shouldComponentUpdate, e2 = r.componentWillUpdate;
      r.componentWillUpdate = function(n3, t2, r2) {
        if (this.__e) {
          var u3 = c2;
          c2 = void 0, f2(n3, t2, r2), c2 = u3;
        }
        e2 && e2.call(this, n3, t2, r2);
      }, r.shouldComponentUpdate = f2;
    }
    return o2.__N || o2.__;
  }
  function y(n2, u2) {
    var i2 = p(t++, 3);
    !c.__s && C$1(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r.__H.__h.push(i2));
  }
  function _(n2, u2) {
    var i2 = p(t++, 4);
    !c.__s && C$1(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r.__h.push(i2));
  }
  function A$1(n2) {
    return o = 5, T$1(function() {
      return { current: n2 };
    }, []);
  }
  function F$1(n2, t2, r2) {
    o = 6, _(function() {
      if ("function" == typeof n2) {
        var r3 = n2(t2());
        return function() {
          n2(null), r3 && "function" == typeof r3 && r3();
        };
      }
      if (n2) return n2.current = t2(), function() {
        return n2.current = null;
      };
    }, null == r2 ? r2 : r2.concat(n2));
  }
  function T$1(n2, r2) {
    var u2 = p(t++, 7);
    return C$1(u2.__H, r2) && (u2.__ = n2(), u2.__H = r2, u2.__h = n2), u2.__;
  }
  function q$1(n2, t2) {
    return o = 8, T$1(function() {
      return n2;
    }, t2);
  }
  function x$1(n2) {
    var u2 = r.context[n2.__c], i2 = p(t++, 9);
    return i2.c = n2, u2 ? (null == i2.__ && (i2.__ = true, u2.sub(r)), u2.props.value) : n2.__;
  }
  function P$1(n2, t2) {
    c.useDebugValue && c.useDebugValue(t2 ? t2(n2) : n2);
  }
  function b(n2) {
    var u2 = p(t++, 10), i2 = d();
    return u2.__ = n2, r.componentDidCatch || (r.componentDidCatch = function(n3, t2) {
      u2.__ && u2.__(n3, t2), i2[1](n3);
    }), [i2[0], function() {
      i2[1](void 0);
    }];
  }
  function g$1() {
    var n2 = p(t++, 11);
    if (!n2.__) {
      for (var u2 = r.__v; null !== u2 && !u2.__m && null !== u2.__; ) u2 = u2.__;
      var i2 = u2.__m || (u2.__m = [0, 0]);
      n2.__ = "P" + i2[0] + "-" + i2[1]++;
    }
    return n2.__;
  }
  function j$1() {
    for (var n2; n2 = f.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z$1), n2.__H.__h.forEach(B$1), n2.__H.__h = [];
    } catch (t2) {
      n2.__H.__h = [], c.__e(t2, n2.__v);
    }
  }
  c.__b = function(n2) {
    r = null, e && e(n2);
  }, c.__ = function(n2, t2) {
    n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), s && s(n2, t2);
  }, c.__r = function(n2) {
    a && a(n2), t = 0;
    var i2 = (r = n2.__c).__H;
    i2 && (u === r ? (i2.__h = [], r.__h = [], i2.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i2.__h.forEach(z$1), i2.__h.forEach(B$1), i2.__h = [], t = 0)), u = r;
  }, c.diffed = function(n2) {
    v && v(n2);
    var t2 = n2.__c;
    t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w$1)(j$1)), t2.__H.__.forEach(function(n3) {
      n3.u && (n3.__H = n3.u), n3.u = void 0;
    })), u = r = null;
  }, c.__c = function(n2, t2) {
    t2.some(function(n3) {
      try {
        n3.__h.forEach(z$1), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B$1(n4);
        });
      } catch (r2) {
        t2.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t2 = [], c.__e(r2, n3.__v);
      }
    }), l && l(n2, t2);
  }, c.unmount = function(n2) {
    m && m(n2);
    var t2, r2 = n2.__c;
    r2 && r2.__H && (r2.__H.__.forEach(function(n3) {
      try {
        z$1(n3);
      } catch (n4) {
        t2 = n4;
      }
    }), r2.__H = void 0, t2 && c.__e(t2, r2.__v));
  };
  var k$1 = "function" == typeof requestAnimationFrame;
  function w$1(n2) {
    var t2, r2 = function() {
      clearTimeout(u2), k$1 && cancelAnimationFrame(t2), setTimeout(n2);
    }, u2 = setTimeout(r2, 35);
    k$1 && (t2 = requestAnimationFrame(r2));
  }
  function z$1(n2) {
    var t2 = r, u2 = n2.__c;
    "function" == typeof u2 && (n2.__c = void 0, u2()), r = t2;
  }
  function B$1(n2) {
    var t2 = r;
    n2.__c = n2.__(), r = t2;
  }
  function C$1(n2, t2) {
    return !n2 || n2.length !== t2.length || t2.some(function(t3, r2) {
      return t3 !== n2[r2];
    });
  }
  function D$1(n2, t2) {
    return "function" == typeof t2 ? t2(n2) : t2;
  }
  function g(n2, t2) {
    for (var e2 in t2) n2[e2] = t2[e2];
    return n2;
  }
  function E(n2, t2) {
    for (var e2 in n2) if ("__source" !== e2 && !(e2 in t2)) return true;
    for (var r2 in t2) if ("__source" !== r2 && n2[r2] !== t2[r2]) return true;
    return false;
  }
  function C(n2, t2) {
    var e2 = t2(), r2 = d({ t: { __: e2, u: t2 } }), u2 = r2[0].t, o2 = r2[1];
    return _(function() {
      u2.__ = e2, u2.u = t2, x(u2) && o2({ t: u2 });
    }, [n2, e2, t2]), y(function() {
      return x(u2) && o2({ t: u2 }), n2(function() {
        x(u2) && o2({ t: u2 });
      });
    }, [n2]), e2;
  }
  function x(n2) {
    var t2, e2, r2 = n2.u, u2 = n2.__;
    try {
      var o2 = r2();
      return !((t2 = u2) === (e2 = o2) && (0 !== t2 || 1 / t2 == 1 / e2) || t2 != t2 && e2 != e2);
    } catch (n3) {
      return true;
    }
  }
  function R(n2) {
    n2();
  }
  function w(n2) {
    return n2;
  }
  function k() {
    return [false, R];
  }
  var I = _;
  function N(n2, t2) {
    this.props = n2, this.context = t2;
  }
  function M(n2, e2) {
    function r2(n3) {
      var t2 = this.props.ref, r3 = t2 == n3.ref;
      return !r3 && t2 && (t2.call ? t2(null) : t2.current = null), e2 ? !e2(this.props, n3) || !r3 : E(this.props, n3);
    }
    function u2(e3) {
      return this.shouldComponentUpdate = r2, _$1(n2, e3);
    }
    return u2.displayName = "Memo(" + (n2.displayName || n2.name) + ")", u2.prototype.isReactComponent = true, u2.__f = true, u2.type = n2, u2;
  }
  (N.prototype = new x$2()).isPureReactComponent = true, N.prototype.shouldComponentUpdate = function(n2, t2) {
    return E(this.props, n2) || E(this.state, t2);
  };
  var T = l$1.__b;
  l$1.__b = function(n2) {
    n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), T && T(n2);
  };
  var A = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
  function D(n2) {
    function t2(t3) {
      var e2 = g({}, t3);
      return delete e2.ref, n2(e2, t3.ref || null);
    }
    return t2.$$typeof = A, t2.render = n2, t2.prototype.isReactComponent = t2.__f = true, t2.displayName = "ForwardRef(" + (n2.displayName || n2.name) + ")", t2;
  }
  var L = function(n2, t2) {
    return null == n2 ? null : H$1(H$1(n2).map(t2));
  }, O = { map: L, forEach: L, count: function(n2) {
    return n2 ? H$1(n2).length : 0;
  }, only: function(n2) {
    var t2 = H$1(n2);
    if (1 !== t2.length) throw "Children.only";
    return t2[0];
  }, toArray: H$1 }, F = l$1.__e;
  l$1.__e = function(n2, t2, e2, r2) {
    if (n2.then) {
      for (var u2, o2 = t2; o2 = o2.__; ) if ((u2 = o2.__c) && u2.__c) return null == t2.__e && (t2.__e = e2.__e, t2.__k = e2.__k), u2.__c(n2, t2);
    }
    F(n2, t2, e2, r2);
  };
  var U = l$1.unmount;
  function V(n2, t2, e2) {
    return n2 && (n2.__c && n2.__c.__H && (n2.__c.__H.__.forEach(function(n3) {
      "function" == typeof n3.__c && n3.__c();
    }), n2.__c.__H = null), null != (n2 = g({}, n2)).__c && (n2.__c.__P === e2 && (n2.__c.__P = t2), n2.__c.__e = true, n2.__c = null), n2.__k = n2.__k && n2.__k.map(function(n3) {
      return V(n3, t2, e2);
    })), n2;
  }
  function W(n2, t2, e2) {
    return n2 && e2 && (n2.__v = null, n2.__k = n2.__k && n2.__k.map(function(n3) {
      return W(n3, t2, e2);
    }), n2.__c && n2.__c.__P === t2 && (n2.__e && e2.appendChild(n2.__e), n2.__c.__e = true, n2.__c.__P = e2)), n2;
  }
  function P() {
    this.__u = 0, this.o = null, this.__b = null;
  }
  function j(n2) {
    var t2 = n2.__.__c;
    return t2 && t2.__a && t2.__a(n2);
  }
  function z(n2) {
    var e2, r2, u2;
    function o2(o3) {
      if (e2 || (e2 = n2()).then(function(n3) {
        r2 = n3.default || n3;
      }, function(n3) {
        u2 = n3;
      }), u2) throw u2;
      if (!r2) throw e2;
      return _$1(r2, o3);
    }
    return o2.displayName = "Lazy", o2.__f = true, o2;
  }
  function B() {
    this.i = null, this.l = null;
  }
  l$1.unmount = function(n2) {
    var t2 = n2.__c;
    t2 && t2.__R && t2.__R(), t2 && 32 & n2.__u && (n2.type = null), U && U(n2);
  }, (P.prototype = new x$2()).__c = function(n2, t2) {
    var e2 = t2.__c, r2 = this;
    null == r2.o && (r2.o = []), r2.o.push(e2);
    var u2 = j(r2.__v), o2 = false, i2 = function() {
      o2 || (o2 = true, e2.__R = null, u2 ? u2(l2) : l2());
    };
    e2.__R = i2;
    var l2 = function() {
      if (!--r2.__u) {
        if (r2.state.__a) {
          var n3 = r2.state.__a;
          r2.__v.__k[0] = W(n3, n3.__c.__P, n3.__c.__O);
        }
        var t3;
        for (r2.setState({ __a: r2.__b = null }); t3 = r2.o.pop(); ) t3.forceUpdate();
      }
    };
    r2.__u++ || 32 & t2.__u || r2.setState({ __a: r2.__b = r2.__v.__k[0] }), n2.then(i2, i2);
  }, P.prototype.componentWillUnmount = function() {
    this.o = [];
  }, P.prototype.render = function(n2, e2) {
    if (this.__b) {
      if (this.__v.__k) {
        var r2 = document.createElement("div"), o2 = this.__v.__k[0].__c;
        this.__v.__k[0] = V(this.__b, r2, o2.__O = o2.__P);
      }
      this.__b = null;
    }
    var i2 = e2.__a && _$1(k$2, null, n2.fallback);
    return i2 && (i2.__u &= -33), [_$1(k$2, null, e2.__a ? null : n2.children), i2];
  };
  var H = function(n2, t2, e2) {
    if (++e2[1] === e2[0] && n2.l.delete(t2), n2.props.revealOrder && ("t" !== n2.props.revealOrder[0] || !n2.l.size)) for (e2 = n2.i; e2; ) {
      for (; e2.length > 3; ) e2.pop()();
      if (e2[1] < e2[0]) break;
      n2.i = e2 = e2[2];
    }
  };
  function Z(n2) {
    return this.getChildContext = function() {
      return n2.context;
    }, n2.children;
  }
  function Y(n2) {
    var e2 = this, r2 = n2.h;
    if (e2.componentWillUnmount = function() {
      G$1(null, e2.v), e2.v = null, e2.h = null;
    }, e2.h && e2.h !== r2 && e2.componentWillUnmount(), !e2.v) {
      for (var u2 = e2.__v; null !== u2 && !u2.__m && null !== u2.__; ) u2 = u2.__;
      e2.h = r2, e2.v = { nodeType: 1, parentNode: r2, childNodes: [], __k: { __m: u2.__m }, contains: function() {
        return true;
      }, insertBefore: function(n3, t2) {
        this.childNodes.push(n3), e2.h.insertBefore(n3, t2);
      }, removeChild: function(n3) {
        this.childNodes.splice(this.childNodes.indexOf(n3) >>> 1, 1), e2.h.removeChild(n3);
      } };
    }
    G$1(_$1(Z, { context: e2.context }, n2.__v), e2.v);
  }
  function $(n2, e2) {
    var r2 = _$1(Y, { __v: n2, h: e2 });
    return r2.containerInfo = e2, r2;
  }
  (B.prototype = new x$2()).__a = function(n2) {
    var t2 = this, e2 = j(t2.__v), r2 = t2.l.get(n2);
    return r2[0]++, function(u2) {
      var o2 = function() {
        t2.props.revealOrder ? (r2.push(u2), H(t2, n2, r2)) : u2();
      };
      e2 ? e2(o2) : o2();
    };
  }, B.prototype.render = function(n2) {
    this.i = null, this.l = /* @__PURE__ */ new Map();
    var t2 = H$1(n2.children);
    n2.revealOrder && "b" === n2.revealOrder[0] && t2.reverse();
    for (var e2 = t2.length; e2--; ) this.l.set(t2[e2], this.i = [1, 0, this.i]);
    return n2.children;
  }, B.prototype.componentDidUpdate = B.prototype.componentDidMount = function() {
    var n2 = this;
    this.l.forEach(function(t2, e2) {
      H(n2, e2, t2);
    });
  };
  var q = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103, G = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, J = /^on(Ani|Tra|Tou|BeforeInp|Compo)/, K = /[A-Z0-9]/g, Q = "undefined" != typeof document, X = function(n2) {
    return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n2);
  };
  function nn(n2, t2, e2) {
    return null == t2.__k && (t2.textContent = ""), G$1(n2, t2), "function" == typeof e2 && e2(), n2 ? n2.__c : null;
  }
  function tn(n2, t2, e2) {
    return J$1(n2, t2), "function" == typeof e2 && e2(), n2 ? n2.__c : null;
  }
  x$2.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t2) {
    Object.defineProperty(x$2.prototype, t2, { configurable: true, get: function() {
      return this["UNSAFE_" + t2];
    }, set: function(n2) {
      Object.defineProperty(this, t2, { configurable: true, writable: true, value: n2 });
    } });
  });
  var en = l$1.event;
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  l$1.event = function(n2) {
    return en && (n2 = en(n2)), n2.persist = rn, n2.isPropagationStopped = un, n2.isDefaultPrevented = on, n2.nativeEvent = n2;
  };
  var ln, cn = { enumerable: false, configurable: true, get: function() {
    return this.class;
  } }, fn = l$1.vnode;
  l$1.vnode = function(n2) {
    "string" == typeof n2.type && function(n3) {
      var t2 = n3.props, e2 = n3.type, u2 = {}, o2 = -1 === e2.indexOf("-");
      for (var i2 in t2) {
        var l2 = t2[i2];
        if (!("value" === i2 && "defaultValue" in t2 && null == l2 || Q && "children" === i2 && "noscript" === e2 || "class" === i2 || "className" === i2)) {
          var c2 = i2.toLowerCase();
          "defaultValue" === i2 && "value" in t2 && null == t2.value ? i2 = "value" : "download" === i2 && true === l2 ? l2 = "" : "translate" === c2 && "no" === l2 ? l2 = false : "o" === c2[0] && "n" === c2[1] ? "ondoubleclick" === c2 ? i2 = "ondblclick" : "onchange" !== c2 || "input" !== e2 && "textarea" !== e2 || X(t2.type) ? "onfocus" === c2 ? i2 = "onfocusin" : "onblur" === c2 ? i2 = "onfocusout" : J.test(i2) && (i2 = c2) : c2 = i2 = "oninput" : o2 && G.test(i2) ? i2 = i2.replace(K, "-$&").toLowerCase() : null === l2 && (l2 = void 0), "oninput" === c2 && u2[i2 = c2] && (i2 = "oninputCapture"), u2[i2] = l2;
        }
      }
      "select" == e2 && u2.multiple && Array.isArray(u2.value) && (u2.value = H$1(t2.children).forEach(function(n4) {
        n4.props.selected = -1 != u2.value.indexOf(n4.props.value);
      })), "select" == e2 && null != u2.defaultValue && (u2.value = H$1(t2.children).forEach(function(n4) {
        n4.props.selected = u2.multiple ? -1 != u2.defaultValue.indexOf(n4.props.value) : u2.defaultValue == n4.props.value;
      })), t2.class && !t2.className ? (u2.class = t2.class, Object.defineProperty(u2, "className", cn)) : (t2.className && !t2.class || t2.class && t2.className) && (u2.class = u2.className = t2.className), n3.props = u2;
    }(n2), n2.$$typeof = q, fn && fn(n2);
  };
  var an = l$1.__r;
  l$1.__r = function(n2) {
    an && an(n2), ln = n2.__c;
  };
  var sn = l$1.diffed;
  l$1.diffed = function(n2) {
    sn && sn(n2);
    var t2 = n2.props, e2 = n2.__e;
    null != e2 && "textarea" === n2.type && "value" in t2 && t2.value !== e2.value && (e2.value = null == t2.value ? "" : t2.value), ln = null;
  };
  var hn = { ReactCurrentDispatcher: { current: { readContext: function(n2) {
    return ln.__n[n2.__c].props.value;
  }, useCallback: q$1, useContext: x$1, useDebugValue: P$1, useDeferredValue: w, useEffect: y, useId: g$1, useImperativeHandle: F$1, useInsertionEffect: I, useLayoutEffect: _, useMemo: T$1, useReducer: h, useRef: A$1, useState: d, useSyncExternalStore: C, useTransition: k } } }, vn = "18.3.1";
  function dn(n2) {
    return _$1.bind(null, n2);
  }
  function mn(n2) {
    return !!n2 && n2.$$typeof === q;
  }
  function pn(n2) {
    return mn(n2) && n2.type === k$2;
  }
  function yn(n2) {
    return !!n2 && !!n2.displayName && ("string" == typeof n2.displayName || n2.displayName instanceof String) && n2.displayName.startsWith("Memo(");
  }
  function _n(n2) {
    return mn(n2) ? K$1.apply(null, arguments) : n2;
  }
  function bn(n2) {
    return !!n2.__k && (G$1(null, n2), true);
  }
  function Sn(n2) {
    return n2 && (n2.base || 1 === n2.nodeType && n2) || null;
  }
  var gn = function(n2, t2) {
    return n2(t2);
  }, En = function(n2, t2) {
    return n2(t2);
  }, Cn = k$2, xn = mn, Rn = { useState: d, useId: g$1, useReducer: h, useEffect: y, useLayoutEffect: _, useInsertionEffect: I, useTransition: k, useDeferredValue: w, useSyncExternalStore: C, startTransition: R, useRef: A$1, useImperativeHandle: F$1, useMemo: T$1, useCallback: q$1, useContext: x$1, useDebugValue: P$1, version: "18.3.1", Children: O, render: nn, hydrate: tn, unmountComponentAtNode: bn, createPortal: $, createElement: _$1, createContext: Q$1, createFactory: dn, cloneElement: _n, createRef: b$1, Fragment: k$2, isValidElement: mn, isElement: xn, isFragment: pn, isMemo: yn, findDOMNode: Sn, Component: x$2, PureComponent: N, memo: M, forwardRef: D, flushSync: En, unstable_batchedUpdates: gn, StrictMode: Cn, Suspense: P, SuspenseList: B, lazy: z, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: hn };
  const compat_module = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Children: O,
    Component: x$2,
    Fragment: k$2,
    PureComponent: N,
    StrictMode: Cn,
    Suspense: P,
    SuspenseList: B,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: hn,
    cloneElement: _n,
    createContext: Q$1,
    createElement: _$1,
    createFactory: dn,
    createPortal: $,
    createRef: b$1,
    default: Rn,
    findDOMNode: Sn,
    flushSync: En,
    forwardRef: D,
    hydrate: tn,
    isElement: xn,
    isFragment: pn,
    isMemo: yn,
    isValidElement: mn,
    lazy: z,
    memo: M,
    render: nn,
    startTransition: R,
    unmountComponentAtNode: bn,
    unstable_batchedUpdates: gn,
    useCallback: q$1,
    useContext: x$1,
    useDebugValue: P$1,
    useDeferredValue: w,
    useEffect: y,
    useErrorBoundary: b,
    useId: g$1,
    useImperativeHandle: F$1,
    useInsertionEffect: I,
    useLayoutEffect: _,
    useMemo: T$1,
    useReducer: h,
    useRef: A$1,
    useState: d,
    useSyncExternalStore: C,
    useTransition: k,
    version: vn
  }, Symbol.toStringTag, { value: "Module" }));
  function getDefaultExportFromCjs(x2) {
    return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
  }
  function getAugmentedNamespace(n2) {
    if (n2.__esModule) return n2;
    var f2 = n2.default;
    if (typeof f2 == "function") {
      var a2 = function a3() {
        if (this instanceof a3) {
          return Reflect.construct(f2, arguments, this.constructor);
        }
        return f2.apply(this, arguments);
      };
      a2.prototype = f2.prototype;
    } else a2 = {};
    Object.defineProperty(a2, "__esModule", { value: true });
    Object.keys(n2).forEach(function(k2) {
      var d2 = Object.getOwnPropertyDescriptor(n2, k2);
      Object.defineProperty(a2, k2, d2.get ? d2 : {
        enumerable: true,
        get: function() {
          return n2[k2];
        }
      });
    });
    return a2;
  }
  var withSelector = { exports: {} };
  var withSelector_production = {};
  const require$$0 = /* @__PURE__ */ getAugmentedNamespace(compat_module);
  var shim = { exports: {} };
  var useSyncExternalStoreShim_production = {};
  /**
   * @license React
   * use-sync-external-store-shim.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredUseSyncExternalStoreShim_production;
  function requireUseSyncExternalStoreShim_production() {
    if (hasRequiredUseSyncExternalStoreShim_production) return useSyncExternalStoreShim_production;
    hasRequiredUseSyncExternalStoreShim_production = 1;
    var React = require$$0;
    function is(x2, y2) {
      return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue2 = React.useDebugValue;
    function useSyncExternalStore$2(subscribe, getSnapshot) {
      var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
      useLayoutEffect(
        function() {
          inst.value = value;
          inst.getSnapshot = getSnapshot;
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        },
        [subscribe, value, getSnapshot]
      );
      useEffect(
        function() {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          return subscribe(function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          });
        },
        [subscribe]
      );
      useDebugValue2(value);
      return value;
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error) {
        return true;
      }
    }
    function useSyncExternalStore$1(subscribe, getSnapshot) {
      return getSnapshot();
    }
    var shim2 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
    useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim2;
    return useSyncExternalStoreShim_production;
  }
  var useSyncExternalStoreShim_development = {};
  /**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredUseSyncExternalStoreShim_development;
  function requireUseSyncExternalStoreShim_development() {
    if (hasRequiredUseSyncExternalStoreShim_development) return useSyncExternalStoreShim_development;
    hasRequiredUseSyncExternalStoreShim_development = 1;
    "production" !== process.env.NODE_ENV && function() {
      function is(x2, y2) {
        return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
      }
      function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe, value, getSnapshot]
        );
        useEffect(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe]
        );
        useDebugValue2(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require$$0, objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim2 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      useSyncExternalStoreShim_development.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim2;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
    return useSyncExternalStoreShim_development;
  }
  var hasRequiredShim;
  function requireShim() {
    if (hasRequiredShim) return shim.exports;
    hasRequiredShim = 1;
    if (process.env.NODE_ENV === "production") {
      shim.exports = requireUseSyncExternalStoreShim_production();
    } else {
      shim.exports = requireUseSyncExternalStoreShim_development();
    }
    return shim.exports;
  }
  /**
   * @license React
   * use-sync-external-store-shim/with-selector.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredWithSelector_production;
  function requireWithSelector_production() {
    if (hasRequiredWithSelector_production) return withSelector_production;
    hasRequiredWithSelector_production = 1;
    var React = require$$0, shim2 = requireShim();
    function is(x2, y2) {
      return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim2.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
    withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
      var instRef = useRef(null);
      if (null === instRef.current) {
        var inst = { hasValue: false, value: null };
        instRef.current = inst;
      } else inst = instRef.current;
      instRef = useMemo(
        function() {
          function memoizedSelector(nextSnapshot) {
            if (!hasMemo) {
              hasMemo = true;
              memoizedSnapshot = nextSnapshot;
              nextSnapshot = selector(nextSnapshot);
              if (void 0 !== isEqual && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual(currentSelection, nextSnapshot))
                  return memoizedSelection = currentSelection;
              }
              return memoizedSelection = nextSnapshot;
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
              return memoizedSnapshot = nextSnapshot, currentSelection;
            memoizedSnapshot = nextSnapshot;
            return memoizedSelection = nextSelection;
          }
          var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
          return [
            function() {
              return memoizedSelector(getSnapshot());
            },
            null === maybeGetServerSnapshot ? void 0 : function() {
              return memoizedSelector(maybeGetServerSnapshot());
            }
          ];
        },
        [getSnapshot, getServerSnapshot, selector, isEqual]
      );
      var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
      useEffect(
        function() {
          inst.hasValue = true;
          inst.value = value;
        },
        [value]
      );
      useDebugValue2(value);
      return value;
    };
    return withSelector_production;
  }
  var withSelector_development = {};
  /**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  var hasRequiredWithSelector_development;
  function requireWithSelector_development() {
    if (hasRequiredWithSelector_development) return withSelector_development;
    hasRequiredWithSelector_development = 1;
    "production" !== process.env.NODE_ENV && function() {
      function is(x2, y2) {
        return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require$$0, shim2 = requireShim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim2.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
      withSelector_development.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
        var instRef = useRef(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector(nextSnapshot);
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector, isEqual]
        );
        var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
        useEffect(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue2(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
    return withSelector_development;
  }
  if (process.env.NODE_ENV === "production") {
    withSelector.exports = requireWithSelector_production();
  } else {
    withSelector.exports = requireWithSelector_development();
  }
  var withSelectorExports = withSelector.exports;
  const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
  const __vite_import_meta_env__ = {};
  const { useDebugValue } = Rn;
  const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
  let didWarnAboutEqualityFn = false;
  const identity = (arg) => arg;
  function useStore$1(api, selector = identity, equalityFn) {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
      console.warn(
        "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
      );
      didWarnAboutEqualityFn = true;
    }
    const slice = useSyncExternalStoreWithSelector(
      api.subscribe,
      api.getState,
      api.getServerState || api.getInitialState,
      selector,
      equalityFn
    );
    useDebugValue(slice);
    return slice;
  }
  const createImpl = (createState) => {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && typeof createState !== "function") {
      console.warn(
        "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
      );
    }
    const api = typeof createState === "function" ? createStore(createState) : createState;
    const useBoundStore = (selector, equalityFn) => useStore$1(api, selector, equalityFn);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  const create = (createState) => createState ? createImpl(createState) : createImpl;
  const useStore = create((set, get2) => ({
    // State
    hass: null,
    config: {},
    favorites: [],
    searchQuery: "",
    selectedCategory: "all",
    viewMode: "grid",
    // Actions
    setHass: (hass) => set({ hass }),
    setConfig: (config) => set({ config }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleFavorite: (entityId) => set((state) => {
      const favorites = state.favorites.includes(entityId) ? state.favorites.filter((id) => id !== entityId) : [...state.favorites, entityId];
      return { favorites };
    })
  }));
  function useDevices(hass, config) {
    return T$1(() => {
      if (!(hass == null ? void 0 : hass.states)) return [];
      const allowedDomains = (config == null ? void 0 : config.domains) || [
        "light",
        "switch",
        "climate",
        "cover",
        "media_player"
      ];
      return Object.values(hass.states).filter((entity) => {
        const domain = entity.entity_id.split(".")[0];
        return allowedDomains.includes(domain);
      }).map((entity) => {
        const domain = entity.entity_id.split(".")[0];
        return {
          entity_id: entity.entity_id,
          domain,
          state: entity.state,
          name: entity.attributes.friendly_name || entity.entity_id,
          attributes: entity.attributes,
          isOn: ["on", "open", "playing"].includes(entity.state),
          isAvailable: entity.state !== "unavailable",
          icon: entity.attributes.icon || getIcon(domain, entity.state)
        };
      });
    }, [hass == null ? void 0 : hass.states, config == null ? void 0 : config.domains]);
  }
  function getIcon(domain, state) {
    const icons = {
      light: state === "on" ? "mdi:lightbulb" : "mdi:lightbulb-outline",
      switch: state === "on" ? "mdi:toggle-switch" : "mdi:toggle-switch-off",
      climate: "mdi:thermostat",
      cover: "mdi:window-shutter",
      media_player: "mdi:cast"
    };
    return icons[domain] || "mdi:home";
  }
  function isArray(value) {
    return !Array.isArray ? getTag(value) === "[object Array]" : Array.isArray(value);
  }
  function baseToString(value) {
    if (typeof value == "string") {
      return value;
    }
    let result = value + "";
    return result == "0" && 1 / value == -Infinity ? "-0" : result;
  }
  function toString(value) {
    return value == null ? "" : baseToString(value);
  }
  function isString(value) {
    return typeof value === "string";
  }
  function isNumber(value) {
    return typeof value === "number";
  }
  function isBoolean(value) {
    return value === true || value === false || isObjectLike(value) && getTag(value) == "[object Boolean]";
  }
  function isObject(value) {
    return typeof value === "object";
  }
  function isObjectLike(value) {
    return isObject(value) && value !== null;
  }
  function isDefined(value) {
    return value !== void 0 && value !== null;
  }
  function isBlank(value) {
    return !value.trim().length;
  }
  function getTag(value) {
    return value == null ? value === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(value);
  }
  const INCORRECT_INDEX_TYPE = "Incorrect 'index' type";
  const LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) => `Invalid value for key ${key}`;
  const PATTERN_LENGTH_TOO_LARGE = (max) => `Pattern length exceeds max of ${max}.`;
  const MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;
  const INVALID_KEY_WEIGHT_VALUE = (key) => `Property 'weight' in key '${key}' must be a positive integer`;
  const hasOwn = Object.prototype.hasOwnProperty;
  class KeyStore {
    constructor(keys) {
      this._keys = [];
      this._keyMap = {};
      let totalWeight = 0;
      keys.forEach((key) => {
        let obj = createKey(key);
        this._keys.push(obj);
        this._keyMap[obj.id] = obj;
        totalWeight += obj.weight;
      });
      this._keys.forEach((key) => {
        key.weight /= totalWeight;
      });
    }
    get(keyId) {
      return this._keyMap[keyId];
    }
    keys() {
      return this._keys;
    }
    toJSON() {
      return JSON.stringify(this._keys);
    }
  }
  function createKey(key) {
    let path = null;
    let id = null;
    let src = null;
    let weight = 1;
    let getFn = null;
    if (isString(key) || isArray(key)) {
      src = key;
      path = createKeyPath(key);
      id = createKeyId(key);
    } else {
      if (!hasOwn.call(key, "name")) {
        throw new Error(MISSING_KEY_PROPERTY("name"));
      }
      const name = key.name;
      src = name;
      if (hasOwn.call(key, "weight")) {
        weight = key.weight;
        if (weight <= 0) {
          throw new Error(INVALID_KEY_WEIGHT_VALUE(name));
        }
      }
      path = createKeyPath(name);
      id = createKeyId(name);
      getFn = key.getFn;
    }
    return { path, id, weight, src, getFn };
  }
  function createKeyPath(key) {
    return isArray(key) ? key : key.split(".");
  }
  function createKeyId(key) {
    return isArray(key) ? key.join(".") : key;
  }
  function get(obj, path) {
    let list = [];
    let arr = false;
    const deepGet = (obj2, path2, index) => {
      if (!isDefined(obj2)) {
        return;
      }
      if (!path2[index]) {
        list.push(obj2);
      } else {
        let key = path2[index];
        const value = obj2[key];
        if (!isDefined(value)) {
          return;
        }
        if (index === path2.length - 1 && (isString(value) || isNumber(value) || isBoolean(value))) {
          list.push(toString(value));
        } else if (isArray(value)) {
          arr = true;
          for (let i2 = 0, len = value.length; i2 < len; i2 += 1) {
            deepGet(value[i2], path2, index + 1);
          }
        } else if (path2.length) {
          deepGet(value, path2, index + 1);
        }
      }
    };
    deepGet(obj, isString(path) ? path.split(".") : path, 0);
    return arr ? list : list[0];
  }
  const MatchOptions = {
    // Whether the matches should be included in the result set. When `true`, each record in the result
    // set will include the indices of the matched characters.
    // These can consequently be used for highlighting purposes.
    includeMatches: false,
    // When `true`, the matching function will continue to the end of a search pattern even if
    // a perfect match has already been located in the string.
    findAllMatches: false,
    // Minimum number of characters that must be matched before a result is considered a match
    minMatchCharLength: 1
  };
  const BasicOptions = {
    // When `true`, the algorithm continues searching to the end of the input even if a perfect
    // match is found before the end of the same input.
    isCaseSensitive: false,
    // When `true`, the algorithm will ignore diacritics (accents) in comparisons
    ignoreDiacritics: false,
    // When true, the matching function will continue to the end of a search pattern even if
    includeScore: false,
    // List of properties that will be searched. This also supports nested properties.
    keys: [],
    // Whether to sort the result list, by score
    shouldSort: true,
    // Default sort function: sort by ascending score, ascending index
    sortFn: (a2, b2) => a2.score === b2.score ? a2.idx < b2.idx ? -1 : 1 : a2.score < b2.score ? -1 : 1
  };
  const FuzzyOptions = {
    // Approximately where in the text is the pattern expected to be found?
    location: 0,
    // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
    // (of both letters and location), a threshold of '1.0' would match anything.
    threshold: 0.6,
    // Determines how close the match must be to the fuzzy location (specified above).
    // An exact letter match which is 'distance' characters away from the fuzzy location
    // would score as a complete mismatch. A distance of '0' requires the match be at
    // the exact location specified, a threshold of '1000' would require a perfect match
    // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
    distance: 100
  };
  const AdvancedOptions = {
    // When `true`, it enables the use of unix-like search commands
    useExtendedSearch: false,
    // The get function to use when fetching an object's properties.
    // The default will search nested paths *ie foo.bar.baz*
    getFn: get,
    // When `true`, search will ignore `location` and `distance`, so it won't matter
    // where in the string the pattern appears.
    // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
    ignoreLocation: false,
    // When `true`, the calculation for the relevance score (used for sorting) will
    // ignore the field-length norm.
    // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
    ignoreFieldNorm: false,
    // The weight to determine how much field length norm effects scoring.
    fieldNormWeight: 1
  };
  var Config = {
    ...BasicOptions,
    ...MatchOptions,
    ...FuzzyOptions,
    ...AdvancedOptions
  };
  const SPACE = /[^ ]+/g;
  function norm(weight = 1, mantissa = 3) {
    const cache = /* @__PURE__ */ new Map();
    const m2 = Math.pow(10, mantissa);
    return {
      get(value) {
        const numTokens = value.match(SPACE).length;
        if (cache.has(numTokens)) {
          return cache.get(numTokens);
        }
        const norm2 = 1 / Math.pow(numTokens, 0.5 * weight);
        const n2 = parseFloat(Math.round(norm2 * m2) / m2);
        cache.set(numTokens, n2);
        return n2;
      },
      clear() {
        cache.clear();
      }
    };
  }
  class FuseIndex {
    constructor({
      getFn = Config.getFn,
      fieldNormWeight = Config.fieldNormWeight
    } = {}) {
      this.norm = norm(fieldNormWeight, 3);
      this.getFn = getFn;
      this.isCreated = false;
      this.setIndexRecords();
    }
    setSources(docs = []) {
      this.docs = docs;
    }
    setIndexRecords(records = []) {
      this.records = records;
    }
    setKeys(keys = []) {
      this.keys = keys;
      this._keysMap = {};
      keys.forEach((key, idx) => {
        this._keysMap[key.id] = idx;
      });
    }
    create() {
      if (this.isCreated || !this.docs.length) {
        return;
      }
      this.isCreated = true;
      if (isString(this.docs[0])) {
        this.docs.forEach((doc, docIndex) => {
          this._addString(doc, docIndex);
        });
      } else {
        this.docs.forEach((doc, docIndex) => {
          this._addObject(doc, docIndex);
        });
      }
      this.norm.clear();
    }
    // Adds a doc to the end of the index
    add(doc) {
      const idx = this.size();
      if (isString(doc)) {
        this._addString(doc, idx);
      } else {
        this._addObject(doc, idx);
      }
    }
    // Removes the doc at the specified index of the index
    removeAt(idx) {
      this.records.splice(idx, 1);
      for (let i2 = idx, len = this.size(); i2 < len; i2 += 1) {
        this.records[i2].i -= 1;
      }
    }
    getValueForItemAtKeyId(item, keyId) {
      return item[this._keysMap[keyId]];
    }
    size() {
      return this.records.length;
    }
    _addString(doc, docIndex) {
      if (!isDefined(doc) || isBlank(doc)) {
        return;
      }
      let record = {
        v: doc,
        i: docIndex,
        n: this.norm.get(doc)
      };
      this.records.push(record);
    }
    _addObject(doc, docIndex) {
      let record = { i: docIndex, $: {} };
      this.keys.forEach((key, keyIndex) => {
        let value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);
        if (!isDefined(value)) {
          return;
        }
        if (isArray(value)) {
          let subRecords = [];
          const stack = [{ nestedArrIndex: -1, value }];
          while (stack.length) {
            const { nestedArrIndex, value: value2 } = stack.pop();
            if (!isDefined(value2)) {
              continue;
            }
            if (isString(value2) && !isBlank(value2)) {
              let subRecord = {
                v: value2,
                i: nestedArrIndex,
                n: this.norm.get(value2)
              };
              subRecords.push(subRecord);
            } else if (isArray(value2)) {
              value2.forEach((item, k2) => {
                stack.push({
                  nestedArrIndex: k2,
                  value: item
                });
              });
            } else ;
          }
          record.$[keyIndex] = subRecords;
        } else if (isString(value) && !isBlank(value)) {
          let subRecord = {
            v: value,
            n: this.norm.get(value)
          };
          record.$[keyIndex] = subRecord;
        }
      });
      this.records.push(record);
    }
    toJSON() {
      return {
        keys: this.keys,
        records: this.records
      };
    }
  }
  function createIndex(keys, docs, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
    const myIndex = new FuseIndex({ getFn, fieldNormWeight });
    myIndex.setKeys(keys.map(createKey));
    myIndex.setSources(docs);
    myIndex.create();
    return myIndex;
  }
  function parseIndex(data, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
    const { keys, records } = data;
    const myIndex = new FuseIndex({ getFn, fieldNormWeight });
    myIndex.setKeys(keys);
    myIndex.setIndexRecords(records);
    return myIndex;
  }
  function computeScore$1(pattern, {
    errors = 0,
    currentLocation = 0,
    expectedLocation = 0,
    distance = Config.distance,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    const accuracy = errors / pattern.length;
    if (ignoreLocation) {
      return accuracy;
    }
    const proximity = Math.abs(expectedLocation - currentLocation);
    if (!distance) {
      return proximity ? 1 : accuracy;
    }
    return accuracy + proximity / distance;
  }
  function convertMaskToIndices(matchmask = [], minMatchCharLength = Config.minMatchCharLength) {
    let indices = [];
    let start = -1;
    let end = -1;
    let i2 = 0;
    for (let len = matchmask.length; i2 < len; i2 += 1) {
      let match = matchmask[i2];
      if (match && start === -1) {
        start = i2;
      } else if (!match && start !== -1) {
        end = i2 - 1;
        if (end - start + 1 >= minMatchCharLength) {
          indices.push([start, end]);
        }
        start = -1;
      }
    }
    if (matchmask[i2 - 1] && i2 - start >= minMatchCharLength) {
      indices.push([start, i2 - 1]);
    }
    return indices;
  }
  const MAX_BITS = 32;
  function search(text, pattern, patternAlphabet, {
    location = Config.location,
    distance = Config.distance,
    threshold = Config.threshold,
    findAllMatches = Config.findAllMatches,
    minMatchCharLength = Config.minMatchCharLength,
    includeMatches = Config.includeMatches,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    if (pattern.length > MAX_BITS) {
      throw new Error(PATTERN_LENGTH_TOO_LARGE(MAX_BITS));
    }
    const patternLen = pattern.length;
    const textLen = text.length;
    const expectedLocation = Math.max(0, Math.min(location, textLen));
    let currentThreshold = threshold;
    let bestLocation = expectedLocation;
    const computeMatches = minMatchCharLength > 1 || includeMatches;
    const matchMask = computeMatches ? Array(textLen) : [];
    let index;
    while ((index = text.indexOf(pattern, bestLocation)) > -1) {
      let score = computeScore$1(pattern, {
        currentLocation: index,
        expectedLocation,
        distance,
        ignoreLocation
      });
      currentThreshold = Math.min(score, currentThreshold);
      bestLocation = index + patternLen;
      if (computeMatches) {
        let i2 = 0;
        while (i2 < patternLen) {
          matchMask[index + i2] = 1;
          i2 += 1;
        }
      }
    }
    bestLocation = -1;
    let lastBitArr = [];
    let finalScore = 1;
    let binMax = patternLen + textLen;
    const mask = 1 << patternLen - 1;
    for (let i2 = 0; i2 < patternLen; i2 += 1) {
      let binMin = 0;
      let binMid = binMax;
      while (binMin < binMid) {
        const score2 = computeScore$1(pattern, {
          errors: i2,
          currentLocation: expectedLocation + binMid,
          expectedLocation,
          distance,
          ignoreLocation
        });
        if (score2 <= currentThreshold) {
          binMin = binMid;
        } else {
          binMax = binMid;
        }
        binMid = Math.floor((binMax - binMin) / 2 + binMin);
      }
      binMax = binMid;
      let start = Math.max(1, expectedLocation - binMid + 1);
      let finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;
      let bitArr = Array(finish + 2);
      bitArr[finish + 1] = (1 << i2) - 1;
      for (let j2 = finish; j2 >= start; j2 -= 1) {
        let currentLocation = j2 - 1;
        let charMatch = patternAlphabet[text.charAt(currentLocation)];
        if (computeMatches) {
          matchMask[currentLocation] = +!!charMatch;
        }
        bitArr[j2] = (bitArr[j2 + 1] << 1 | 1) & charMatch;
        if (i2) {
          bitArr[j2] |= (lastBitArr[j2 + 1] | lastBitArr[j2]) << 1 | 1 | lastBitArr[j2 + 1];
        }
        if (bitArr[j2] & mask) {
          finalScore = computeScore$1(pattern, {
            errors: i2,
            currentLocation,
            expectedLocation,
            distance,
            ignoreLocation
          });
          if (finalScore <= currentThreshold) {
            currentThreshold = finalScore;
            bestLocation = currentLocation;
            if (bestLocation <= expectedLocation) {
              break;
            }
            start = Math.max(1, 2 * expectedLocation - bestLocation);
          }
        }
      }
      const score = computeScore$1(pattern, {
        errors: i2 + 1,
        currentLocation: expectedLocation,
        expectedLocation,
        distance,
        ignoreLocation
      });
      if (score > currentThreshold) {
        break;
      }
      lastBitArr = bitArr;
    }
    const result = {
      isMatch: bestLocation >= 0,
      // Count exact matches (those with a score of 0) to be "almost" exact
      score: Math.max(1e-3, finalScore)
    };
    if (computeMatches) {
      const indices = convertMaskToIndices(matchMask, minMatchCharLength);
      if (!indices.length) {
        result.isMatch = false;
      } else if (includeMatches) {
        result.indices = indices;
      }
    }
    return result;
  }
  function createPatternAlphabet(pattern) {
    let mask = {};
    for (let i2 = 0, len = pattern.length; i2 < len; i2 += 1) {
      const char = pattern.charAt(i2);
      mask[char] = (mask[char] || 0) | 1 << len - i2 - 1;
    }
    return mask;
  }
  const stripDiacritics = String.prototype.normalize ? (str) => str.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "") : (str) => str;
  class BitapSearch {
    constructor(pattern, {
      location = Config.location,
      threshold = Config.threshold,
      distance = Config.distance,
      includeMatches = Config.includeMatches,
      findAllMatches = Config.findAllMatches,
      minMatchCharLength = Config.minMatchCharLength,
      isCaseSensitive = Config.isCaseSensitive,
      ignoreDiacritics = Config.ignoreDiacritics,
      ignoreLocation = Config.ignoreLocation
    } = {}) {
      this.options = {
        location,
        threshold,
        distance,
        includeMatches,
        findAllMatches,
        minMatchCharLength,
        isCaseSensitive,
        ignoreDiacritics,
        ignoreLocation
      };
      pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
      pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
      this.pattern = pattern;
      this.chunks = [];
      if (!this.pattern.length) {
        return;
      }
      const addChunk = (pattern2, startIndex) => {
        this.chunks.push({
          pattern: pattern2,
          alphabet: createPatternAlphabet(pattern2),
          startIndex
        });
      };
      const len = this.pattern.length;
      if (len > MAX_BITS) {
        let i2 = 0;
        const remainder = len % MAX_BITS;
        const end = len - remainder;
        while (i2 < end) {
          addChunk(this.pattern.substr(i2, MAX_BITS), i2);
          i2 += MAX_BITS;
        }
        if (remainder) {
          const startIndex = len - MAX_BITS;
          addChunk(this.pattern.substr(startIndex), startIndex);
        }
      } else {
        addChunk(this.pattern, 0);
      }
    }
    searchIn(text) {
      const { isCaseSensitive, ignoreDiacritics, includeMatches } = this.options;
      text = isCaseSensitive ? text : text.toLowerCase();
      text = ignoreDiacritics ? stripDiacritics(text) : text;
      if (this.pattern === text) {
        let result2 = {
          isMatch: true,
          score: 0
        };
        if (includeMatches) {
          result2.indices = [[0, text.length - 1]];
        }
        return result2;
      }
      const {
        location,
        distance,
        threshold,
        findAllMatches,
        minMatchCharLength,
        ignoreLocation
      } = this.options;
      let allIndices = [];
      let totalScore = 0;
      let hasMatches = false;
      this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
        const { isMatch, score, indices } = search(text, pattern, alphabet, {
          location: location + startIndex,
          distance,
          threshold,
          findAllMatches,
          minMatchCharLength,
          includeMatches,
          ignoreLocation
        });
        if (isMatch) {
          hasMatches = true;
        }
        totalScore += score;
        if (isMatch && indices) {
          allIndices = [...allIndices, ...indices];
        }
      });
      let result = {
        isMatch: hasMatches,
        score: hasMatches ? totalScore / this.chunks.length : 1
      };
      if (hasMatches && includeMatches) {
        result.indices = allIndices;
      }
      return result;
    }
  }
  class BaseMatch {
    constructor(pattern) {
      this.pattern = pattern;
    }
    static isMultiMatch(pattern) {
      return getMatch(pattern, this.multiRegex);
    }
    static isSingleMatch(pattern) {
      return getMatch(pattern, this.singleRegex);
    }
    search() {
    }
  }
  function getMatch(pattern, exp) {
    const matches = pattern.match(exp);
    return matches ? matches[1] : null;
  }
  class ExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "exact";
    }
    static get multiRegex() {
      return /^="(.*)"$/;
    }
    static get singleRegex() {
      return /^=(.*)$/;
    }
    search(text) {
      const isMatch = text === this.pattern;
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [0, this.pattern.length - 1]
      };
    }
  }
  class InverseExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "inverse-exact";
    }
    static get multiRegex() {
      return /^!"(.*)"$/;
    }
    static get singleRegex() {
      return /^!(.*)$/;
    }
    search(text) {
      const index = text.indexOf(this.pattern);
      const isMatch = index === -1;
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [0, text.length - 1]
      };
    }
  }
  class PrefixExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "prefix-exact";
    }
    static get multiRegex() {
      return /^\^"(.*)"$/;
    }
    static get singleRegex() {
      return /^\^(.*)$/;
    }
    search(text) {
      const isMatch = text.startsWith(this.pattern);
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [0, this.pattern.length - 1]
      };
    }
  }
  class InversePrefixExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "inverse-prefix-exact";
    }
    static get multiRegex() {
      return /^!\^"(.*)"$/;
    }
    static get singleRegex() {
      return /^!\^(.*)$/;
    }
    search(text) {
      const isMatch = !text.startsWith(this.pattern);
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [0, text.length - 1]
      };
    }
  }
  class SuffixExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "suffix-exact";
    }
    static get multiRegex() {
      return /^"(.*)"\$$/;
    }
    static get singleRegex() {
      return /^(.*)\$$/;
    }
    search(text) {
      const isMatch = text.endsWith(this.pattern);
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [text.length - this.pattern.length, text.length - 1]
      };
    }
  }
  class InverseSuffixExactMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "inverse-suffix-exact";
    }
    static get multiRegex() {
      return /^!"(.*)"\$$/;
    }
    static get singleRegex() {
      return /^!(.*)\$$/;
    }
    search(text) {
      const isMatch = !text.endsWith(this.pattern);
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices: [0, text.length - 1]
      };
    }
  }
  class FuzzyMatch extends BaseMatch {
    constructor(pattern, {
      location = Config.location,
      threshold = Config.threshold,
      distance = Config.distance,
      includeMatches = Config.includeMatches,
      findAllMatches = Config.findAllMatches,
      minMatchCharLength = Config.minMatchCharLength,
      isCaseSensitive = Config.isCaseSensitive,
      ignoreDiacritics = Config.ignoreDiacritics,
      ignoreLocation = Config.ignoreLocation
    } = {}) {
      super(pattern);
      this._bitapSearch = new BitapSearch(pattern, {
        location,
        threshold,
        distance,
        includeMatches,
        findAllMatches,
        minMatchCharLength,
        isCaseSensitive,
        ignoreDiacritics,
        ignoreLocation
      });
    }
    static get type() {
      return "fuzzy";
    }
    static get multiRegex() {
      return /^"(.*)"$/;
    }
    static get singleRegex() {
      return /^(.*)$/;
    }
    search(text) {
      return this._bitapSearch.searchIn(text);
    }
  }
  class IncludeMatch extends BaseMatch {
    constructor(pattern) {
      super(pattern);
    }
    static get type() {
      return "include";
    }
    static get multiRegex() {
      return /^'"(.*)"$/;
    }
    static get singleRegex() {
      return /^'(.*)$/;
    }
    search(text) {
      let location = 0;
      let index;
      const indices = [];
      const patternLen = this.pattern.length;
      while ((index = text.indexOf(this.pattern, location)) > -1) {
        location = index + patternLen;
        indices.push([index, location - 1]);
      }
      const isMatch = !!indices.length;
      return {
        isMatch,
        score: isMatch ? 0 : 1,
        indices
      };
    }
  }
  const searchers = [
    ExactMatch,
    IncludeMatch,
    PrefixExactMatch,
    InversePrefixExactMatch,
    InverseSuffixExactMatch,
    SuffixExactMatch,
    InverseExactMatch,
    FuzzyMatch
  ];
  const searchersLen = searchers.length;
  const SPACE_RE = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
  const OR_TOKEN = "|";
  function parseQuery(pattern, options = {}) {
    return pattern.split(OR_TOKEN).map((item) => {
      let query = item.trim().split(SPACE_RE).filter((item2) => item2 && !!item2.trim());
      let results = [];
      for (let i2 = 0, len = query.length; i2 < len; i2 += 1) {
        const queryItem = query[i2];
        let found = false;
        let idx = -1;
        while (!found && ++idx < searchersLen) {
          const searcher = searchers[idx];
          let token = searcher.isMultiMatch(queryItem);
          if (token) {
            results.push(new searcher(token, options));
            found = true;
          }
        }
        if (found) {
          continue;
        }
        idx = -1;
        while (++idx < searchersLen) {
          const searcher = searchers[idx];
          let token = searcher.isSingleMatch(queryItem);
          if (token) {
            results.push(new searcher(token, options));
            break;
          }
        }
      }
      return results;
    });
  }
  const MultiMatchSet = /* @__PURE__ */ new Set([FuzzyMatch.type, IncludeMatch.type]);
  class ExtendedSearch {
    constructor(pattern, {
      isCaseSensitive = Config.isCaseSensitive,
      ignoreDiacritics = Config.ignoreDiacritics,
      includeMatches = Config.includeMatches,
      minMatchCharLength = Config.minMatchCharLength,
      ignoreLocation = Config.ignoreLocation,
      findAllMatches = Config.findAllMatches,
      location = Config.location,
      threshold = Config.threshold,
      distance = Config.distance
    } = {}) {
      this.query = null;
      this.options = {
        isCaseSensitive,
        ignoreDiacritics,
        includeMatches,
        minMatchCharLength,
        findAllMatches,
        ignoreLocation,
        location,
        threshold,
        distance
      };
      pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
      pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
      this.pattern = pattern;
      this.query = parseQuery(this.pattern, this.options);
    }
    static condition(_2, options) {
      return options.useExtendedSearch;
    }
    searchIn(text) {
      const query = this.query;
      if (!query) {
        return {
          isMatch: false,
          score: 1
        };
      }
      const { includeMatches, isCaseSensitive, ignoreDiacritics } = this.options;
      text = isCaseSensitive ? text : text.toLowerCase();
      text = ignoreDiacritics ? stripDiacritics(text) : text;
      let numMatches = 0;
      let allIndices = [];
      let totalScore = 0;
      for (let i2 = 0, qLen = query.length; i2 < qLen; i2 += 1) {
        const searchers2 = query[i2];
        allIndices.length = 0;
        numMatches = 0;
        for (let j2 = 0, pLen = searchers2.length; j2 < pLen; j2 += 1) {
          const searcher = searchers2[j2];
          const { isMatch, indices, score } = searcher.search(text);
          if (isMatch) {
            numMatches += 1;
            totalScore += score;
            if (includeMatches) {
              const type = searcher.constructor.type;
              if (MultiMatchSet.has(type)) {
                allIndices = [...allIndices, ...indices];
              } else {
                allIndices.push(indices);
              }
            }
          } else {
            totalScore = 0;
            numMatches = 0;
            allIndices.length = 0;
            break;
          }
        }
        if (numMatches) {
          let result = {
            isMatch: true,
            score: totalScore / numMatches
          };
          if (includeMatches) {
            result.indices = allIndices;
          }
          return result;
        }
      }
      return {
        isMatch: false,
        score: 1
      };
    }
  }
  const registeredSearchers = [];
  function register(...args) {
    registeredSearchers.push(...args);
  }
  function createSearcher(pattern, options) {
    for (let i2 = 0, len = registeredSearchers.length; i2 < len; i2 += 1) {
      let searcherClass = registeredSearchers[i2];
      if (searcherClass.condition(pattern, options)) {
        return new searcherClass(pattern, options);
      }
    }
    return new BitapSearch(pattern, options);
  }
  const LogicalOperator = {
    AND: "$and",
    OR: "$or"
  };
  const KeyType = {
    PATH: "$path",
    PATTERN: "$val"
  };
  const isExpression = (query) => !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);
  const isPath = (query) => !!query[KeyType.PATH];
  const isLeaf = (query) => !isArray(query) && isObject(query) && !isExpression(query);
  const convertToExplicit = (query) => ({
    [LogicalOperator.AND]: Object.keys(query).map((key) => ({
      [key]: query[key]
    }))
  });
  function parse(query, options, { auto = true } = {}) {
    const next = (query2) => {
      let keys = Object.keys(query2);
      const isQueryPath = isPath(query2);
      if (!isQueryPath && keys.length > 1 && !isExpression(query2)) {
        return next(convertToExplicit(query2));
      }
      if (isLeaf(query2)) {
        const key = isQueryPath ? query2[KeyType.PATH] : keys[0];
        const pattern = isQueryPath ? query2[KeyType.PATTERN] : query2[key];
        if (!isString(pattern)) {
          throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key));
        }
        const obj = {
          keyId: createKeyId(key),
          pattern
        };
        if (auto) {
          obj.searcher = createSearcher(pattern, options);
        }
        return obj;
      }
      let node = {
        children: [],
        operator: keys[0]
      };
      keys.forEach((key) => {
        const value = query2[key];
        if (isArray(value)) {
          value.forEach((item) => {
            node.children.push(next(item));
          });
        }
      });
      return node;
    };
    if (!isExpression(query)) {
      query = convertToExplicit(query);
    }
    return next(query);
  }
  function computeScore(results, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
    results.forEach((result) => {
      let totalScore = 1;
      result.matches.forEach(({ key, norm: norm2, score }) => {
        const weight = key ? key.weight : null;
        totalScore *= Math.pow(
          score === 0 && weight ? Number.EPSILON : score,
          (weight || 1) * (ignoreFieldNorm ? 1 : norm2)
        );
      });
      result.score = totalScore;
    });
  }
  function transformMatches(result, data) {
    const matches = result.matches;
    data.matches = [];
    if (!isDefined(matches)) {
      return;
    }
    matches.forEach((match) => {
      if (!isDefined(match.indices) || !match.indices.length) {
        return;
      }
      const { indices, value } = match;
      let obj = {
        indices,
        value
      };
      if (match.key) {
        obj.key = match.key.src;
      }
      if (match.idx > -1) {
        obj.refIndex = match.idx;
      }
      data.matches.push(obj);
    });
  }
  function transformScore(result, data) {
    data.score = result.score;
  }
  function format(results, docs, {
    includeMatches = Config.includeMatches,
    includeScore = Config.includeScore
  } = {}) {
    const transformers = [];
    if (includeMatches) transformers.push(transformMatches);
    if (includeScore) transformers.push(transformScore);
    return results.map((result) => {
      const { idx } = result;
      const data = {
        item: docs[idx],
        refIndex: idx
      };
      if (transformers.length) {
        transformers.forEach((transformer) => {
          transformer(result, data);
        });
      }
      return data;
    });
  }
  class Fuse {
    constructor(docs, options = {}, index) {
      this.options = { ...Config, ...options };
      if (this.options.useExtendedSearch && false) ;
      this._keyStore = new KeyStore(this.options.keys);
      this.setCollection(docs, index);
    }
    setCollection(docs, index) {
      this._docs = docs;
      if (index && !(index instanceof FuseIndex)) {
        throw new Error(INCORRECT_INDEX_TYPE);
      }
      this._myIndex = index || createIndex(this.options.keys, this._docs, {
        getFn: this.options.getFn,
        fieldNormWeight: this.options.fieldNormWeight
      });
    }
    add(doc) {
      if (!isDefined(doc)) {
        return;
      }
      this._docs.push(doc);
      this._myIndex.add(doc);
    }
    remove(predicate = () => false) {
      const results = [];
      for (let i2 = 0, len = this._docs.length; i2 < len; i2 += 1) {
        const doc = this._docs[i2];
        if (predicate(doc, i2)) {
          this.removeAt(i2);
          i2 -= 1;
          len -= 1;
          results.push(doc);
        }
      }
      return results;
    }
    removeAt(idx) {
      this._docs.splice(idx, 1);
      this._myIndex.removeAt(idx);
    }
    getIndex() {
      return this._myIndex;
    }
    search(query, { limit = -1 } = {}) {
      const {
        includeMatches,
        includeScore,
        shouldSort,
        sortFn,
        ignoreFieldNorm
      } = this.options;
      let results = isString(query) ? isString(this._docs[0]) ? this._searchStringList(query) : this._searchObjectList(query) : this._searchLogical(query);
      computeScore(results, { ignoreFieldNorm });
      if (shouldSort) {
        results.sort(sortFn);
      }
      if (isNumber(limit) && limit > -1) {
        results = results.slice(0, limit);
      }
      return format(results, this._docs, {
        includeMatches,
        includeScore
      });
    }
    _searchStringList(query) {
      const searcher = createSearcher(query, this.options);
      const { records } = this._myIndex;
      const results = [];
      records.forEach(({ v: text, i: idx, n: norm2 }) => {
        if (!isDefined(text)) {
          return;
        }
        const { isMatch, score, indices } = searcher.searchIn(text);
        if (isMatch) {
          results.push({
            item: text,
            idx,
            matches: [{ score, value: text, norm: norm2, indices }]
          });
        }
      });
      return results;
    }
    _searchLogical(query) {
      const expression = parse(query, this.options);
      const evaluate = (node, item, idx) => {
        if (!node.children) {
          const { keyId, searcher } = node;
          const matches = this._findMatches({
            key: this._keyStore.get(keyId),
            value: this._myIndex.getValueForItemAtKeyId(item, keyId),
            searcher
          });
          if (matches && matches.length) {
            return [
              {
                idx,
                item,
                matches
              }
            ];
          }
          return [];
        }
        const res = [];
        for (let i2 = 0, len = node.children.length; i2 < len; i2 += 1) {
          const child = node.children[i2];
          const result = evaluate(child, item, idx);
          if (result.length) {
            res.push(...result);
          } else if (node.operator === LogicalOperator.AND) {
            return [];
          }
        }
        return res;
      };
      const records = this._myIndex.records;
      const resultMap = {};
      const results = [];
      records.forEach(({ $: item, i: idx }) => {
        if (isDefined(item)) {
          let expResults = evaluate(expression, item, idx);
          if (expResults.length) {
            if (!resultMap[idx]) {
              resultMap[idx] = { idx, item, matches: [] };
              results.push(resultMap[idx]);
            }
            expResults.forEach(({ matches }) => {
              resultMap[idx].matches.push(...matches);
            });
          }
        }
      });
      return results;
    }
    _searchObjectList(query) {
      const searcher = createSearcher(query, this.options);
      const { keys, records } = this._myIndex;
      const results = [];
      records.forEach(({ $: item, i: idx }) => {
        if (!isDefined(item)) {
          return;
        }
        let matches = [];
        keys.forEach((key, keyIndex) => {
          matches.push(
            ...this._findMatches({
              key,
              value: item[keyIndex],
              searcher
            })
          );
        });
        if (matches.length) {
          results.push({
            idx,
            item,
            matches
          });
        }
      });
      return results;
    }
    _findMatches({ key, value, searcher }) {
      if (!isDefined(value)) {
        return [];
      }
      let matches = [];
      if (isArray(value)) {
        value.forEach(({ v: text, i: idx, n: norm2 }) => {
          if (!isDefined(text)) {
            return;
          }
          const { isMatch, score, indices } = searcher.searchIn(text);
          if (isMatch) {
            matches.push({
              score,
              key,
              value: text,
              idx,
              norm: norm2,
              indices
            });
          }
        });
      } else {
        const { v: text, n: norm2 } = value;
        const { isMatch, score, indices } = searcher.searchIn(text);
        if (isMatch) {
          matches.push({ score, key, value: text, norm: norm2, indices });
        }
      }
      return matches;
    }
  }
  Fuse.version = "7.1.0";
  Fuse.createIndex = createIndex;
  Fuse.parseIndex = parseIndex;
  Fuse.config = Config;
  {
    Fuse.parseQuery = parse;
  }
  {
    register(ExtendedSearch);
  }
  function useSearch(devices, query, options = {}) {
    const { category = "all", favorites = [], maxResults = 50 } = options;
    const favoritesSet = T$1(() => new Set(favorites), [favorites]);
    const fuse = T$1(() => {
      if (!devices || devices.length === 0) return null;
      return new Fuse(devices, {
        keys: ["name", "entity_id"],
        threshold: 0.3
      });
    }, [devices]);
    return T$1(() => {
      let results = devices || [];
      if (category !== "all") {
        results = results.filter((d2) => d2.domain === category);
      }
      if (query && fuse) {
        results = fuse.search(query).map((r2) => r2.item);
      }
      results.sort((a2, b2) => {
        const aFav = favoritesSet.has(a2.entity_id);
        const bFav = favoritesSet.has(b2.entity_id);
        if (aFav !== bFav) return aFav ? -1 : 1;
        return 0;
      });
      return results.slice(0, maxResults);
    }, [devices, query, category, favoritesSet, fuse, maxResults]);
  }
  function DeviceCard({ device, onToggle, onFavorite, isFavorite }) {
    const handleClick = () => {
      if (onToggle) onToggle(device);
    };
    const handleFavorite = (e2) => {
      e2.stopPropagation();
      if (onFavorite) onFavorite(device.entity_id);
    };
    return /* @__PURE__ */ u$1(
      "div",
      {
        onClick: handleClick,
        style: {
          padding: "12px",
          background: device.isOn ? "#e3f2fd" : "#f5f5f5",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [
          /* @__PURE__ */ u$1("div", { children: [
            /* @__PURE__ */ u$1("div", { style: { fontWeight: "bold" }, children: device.name }),
            /* @__PURE__ */ u$1("div", { style: { fontSize: "12px", color: "#666" }, children: device.state })
          ] }),
          /* @__PURE__ */ u$1(
            "button",
            {
              onClick: handleFavorite,
              style: {
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer"
              },
              children: isFavorite ? "⭐" : "☆"
            }
          )
        ]
      }
    );
  }
  function SearchBar({ value, onChange, categories, activeCategory, onCategoryChange }) {
    return /* @__PURE__ */ u$1("div", { style: { marginBottom: "16px" }, children: [
      /* @__PURE__ */ u$1(
        "input",
        {
          type: "text",
          value,
          onInput: (e2) => onChange(e2.target.value),
          placeholder: "Search devices...",
          style: {
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxSizing: "border-box"
          }
        }
      ),
      /* @__PURE__ */ u$1("div", { style: { display: "flex", gap: "8px", marginTop: "8px" }, children: categories.map((cat) => /* @__PURE__ */ u$1(
        "button",
        {
          onClick: () => onCategoryChange(cat.id),
          style: {
            padding: "6px 12px",
            border: "1px solid #ddd",
            borderRadius: "16px",
            background: activeCategory === cat.id ? "#007AFF" : "white",
            color: activeCategory === cat.id ? "white" : "black",
            cursor: "pointer"
          },
          children: cat.label
        },
        cat.id
      )) })
    ] });
  }
  function App({ hass, config, onAction }) {
    const {
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      favorites,
      toggleFavorite
    } = useStore();
    const devices = useDevices(hass, config);
    const searchResults = useSearch(devices, searchQuery, {
      category: selectedCategory,
      favorites,
      maxResults: (config == null ? void 0 : config.max_results) || 50
    });
    if (!hass) {
      return /* @__PURE__ */ u$1("div", { style: { padding: "16px" }, children: /* @__PURE__ */ u$1("div", { children: "Loading..." }) });
    }
    const categories = [
      { id: "all", label: "All" },
      { id: "light", label: "Lights" },
      { id: "switch", label: "Switches" },
      { id: "climate", label: "Climate" }
    ];
    const handleToggle = async (device) => {
      if (onAction) {
        await onAction({
          type: "TOGGLE",
          entityId: device.entity_id
        });
      }
    };
    return /* @__PURE__ */ u$1("div", { style: { padding: "16px", fontFamily: "system-ui, sans-serif" }, children: [
      /* @__PURE__ */ u$1("h2", { style: { margin: "0 0 16px 0" }, children: (config == null ? void 0 : config.title) || "Device Search" }),
      /* @__PURE__ */ u$1(
        SearchBar,
        {
          value: searchQuery,
          onChange: setSearchQuery,
          categories,
          activeCategory: selectedCategory,
          onCategoryChange: setSelectedCategory
        }
      ),
      /* @__PURE__ */ u$1("div", { style: { display: "grid", gap: "8px" }, children: searchResults.length > 0 ? searchResults.map((device) => /* @__PURE__ */ u$1(
        DeviceCard,
        {
          device,
          onToggle: handleToggle,
          onFavorite: toggleFavorite,
          isFavorite: favorites.includes(device.entity_id)
        },
        device.entity_id
      )) : /* @__PURE__ */ u$1("div", { style: {
        padding: "32px",
        textAlign: "center",
        color: "#666"
      }, children: searchQuery ? `No devices found for "${searchQuery}"` : "No devices available" }) }),
      /* @__PURE__ */ u$1("div", { style: {
        marginTop: "16px",
        padding: "8px",
        background: "#f0f0f0",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#666"
      }, children: [
        "Found ",
        searchResults.length,
        " devices • Total: ",
        devices.length
      ] })
    ] });
  }
  class FastSearchCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.handleAction = this.handleAction.bind(this);
    }
    connectedCallback() {
      this.render();
    }
    setConfig(config) {
      this._config = config;
      useStore.getState().setConfig(config);
      this.render();
    }
    set hass(hass) {
      this._hass = hass;
      useStore.getState().setHass(hass);
      this.render();
    }
    async handleAction(action) {
      if (!this._hass) return;
      try {
        switch (action.type) {
          case "TOGGLE":
            await this._hass.callService("homeassistant", "toggle", {
              entity_id: action.entityId
            });
            break;
        }
      } catch (error) {
        console.error("Action failed:", error);
      }
    }
    render() {
      G$1(
        /* @__PURE__ */ u$1(
          App,
          {
            hass: this._hass,
            config: this._config,
            onAction: this.handleAction
          }
        ),
        this.shadowRoot
      );
    }
    static getStubConfig() {
      return {
        type: "custom:fast-search-card",
        title: "Search",
        domains: ["light", "switch", "climate"],
        max_results: 50
      };
    }
    getCardSize() {
      var _a;
      return ((_a = this._config) == null ? void 0 : _a.card_height) || 4;
    }
  }
  if (!customElements.get("fast-search-card")) {
    customElements.define("fast-search-card", FastSearchCard);
  }
  window.customCards = window.customCards || [];
  if (!window.customCards.find((c2) => c2.type === "fast-search-card")) {
    window.customCards.push({
      type: "fast-search-card",
      name: "Fast Search Card",
      preview: true,
      description: "Fast search card with Preact"
    });
  }
  console.info("%c FAST-SEARCH-CARD v2 ", "background: #007AFF; color: white; font-weight: bold;");
})();
