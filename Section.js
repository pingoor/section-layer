define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/topic',
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/dom-geometry",
  "dojo/dom-class",
  "esri/geometry/screenUtils"
],
function (declare, lang, topic, domConstruct, domStyle, domGeometry, domClass, screenUtils) {
    var clazz = declare(null, {
        declaredClass: 'pingoor.layers.Section',

        // should be unique
        id: null,

        // default offset 
        offset: { x: 5, y: 5 },

        style: {
            "position": "absolute",
            "margin": "0px",
            "padding": "0px",
            "z-index": "100", 
            "width": "100px",
            "height": "100px"
        },

        data: null,

        className: null,

        constructor: function (position, content, params) {
            lang.mixin(this, params);
            this._position = position || this.position;
            this._content = content || this.content;
            this.data = this.data || {};
            this.id = this.id;
            // set default style
            if (!lang.exists("position", this.style))
                this.style["position"] = "absolute";
            if (!lang.exists("width", this.style))
                this.style["width"] = "100px";
            if (!lang.exists("height", this.style))
                this.style["height"] = "100px";
            this._initDomNode();
            this._drawn = false;
        },

        _initDomNode: function(){
            this._div = domConstruct.create('div', { style: this.style, id: this.id });
            if (this.className || typeof this.className === 'string')
                domClass.add(this._div, this.className);

            if (this._content) {
                if (typeof this._content === 'string') {
                    this._div.innerHTML = this._content;
                } else if (this._content.domNode) {
                    this._content.placeAt(this._div);
                } else if (this._content instanceof HTMLElement) {
                    domConstruct.place(this._content, this._div);
                }
            }
        },

        getNode: function(){
            return this._div;
        },

        getPosition: function () {
            return this._position;
        },

        getWidth: function(){
            return domGeometry.getContentBox(this._div).w;
        },

        getHeight: function(){
            return domGeometry.getContentBox(this._div).h;
        },

        getLayer: function(){
            return this._layer;
        },

        _setLayer: function(layer){
            this._layer = layer;
        },

        setId: function(id){
            this.id = id;
        },

        setPosition: function (position) {
            this._position = position;
        },

        setContent: function (content) {
            this._content = content;
        },

        setOffset: function(x,y){
            this.offset.x = x ? x : this.offset.x;
            this.offset.y = y ? y : this.offset.y;
        },

        setStyle: function(style){
            this.style = style;
        },

        _refresh: function () {
            if (!this._drawn || (!this._div.parentNode && !this._div.parentElement)) return;
            if (this._position.x && this._position.y) {
                var screenPt = screenUtils.toScreenPoint(this._layer._map.extent,
                    this._layer._map.width,
                    this._layer._map.height,
                    this._position);
                lang.mixin(this.style, {
                    "left": screenPt.x + this.offset.x + "px",
                    "top": screenPt.y + this.offset.y + "px"
                });
            }
            domStyle.set(this._div, this.style);
            if (this.className || typeof this.className === 'string')
                domClass.add(this._div, this.className);
            if (this._content) {
                if (typeof this._content === 'string') {
                    this._div.innerHTML = this._content;
                } else if (this._content.domNode) {
                    this._content.placeAt(this._div);
                } else if (this._content instanceof HTMLElement) {
                    domConstruct.place(this._content, this._div);
                }
            }
        },

        refresh: function () {
            this._refresh();
        }

    });

    return clazz;
});