define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/connect',
  'dojo/_base/array',
  'dojo/topic',
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-style",
  "esri/kernel",
  'esri/geometry/screenUtils',
  'esri/layers/layer',
  "./Section"
],
function (declare, lang, dojoConnect, array, topic, dom, domConstruct, domStyle, kernel,
    screenUtils, Layer, Section) {

    var clazz = declare(Layer, {

        declaredClass: 'pingoor.layers.SectionLayer',

        // default layer opacity
        opacity: 1,

        constructor: function () {
            this.sections = [];

            dojoConnect.connect(this, "onSuspend", this, this._onSuspend);
            dojoConnect.connect(this, "onResume", this, this._onResume);

            this._drawn = false;
            this.loaded = true;
            this.onLoad(this);
        },

        add: function (section) {
            if (section._layer === this) return section;
            if (this.sections.indexOf(section) < 0)
                this.sections.push(section);
            else return section;

            section._setLayer(this);
            this._drawSection(section);
            this.onSectionAdd(section);

            return section;
        },
        onSectionAdd: function(){},

        _drawSection: function (section) {
            if (!this._drawn) return;

            var screenPt = screenUtils.toScreenPoint(this._map.extent, this._map.width, this._map.height, section._position);
            domStyle.set(section._div, {
                "left": screenPt.x + section.offset.x + "px",
                "top": screenPt.y + section.offset.y + "px"
            });
            domConstruct.place(section._div, this._div);
            section._drawn = true;
        },

        clear: function(){
            for (var i = 0, k = this.Sections; i < k.length; i++) {
                this.remove(k[i]);
            }
            this.onSectionClear()
        },
        onSectionClear: function(){},

        remove: function (section) {
            var index;
            if (-1 === (index = array.indexOf(this.sections, section)))
                return null;
            section = this.Sections.splice(index, 1)[0];
            section._setLayer(null);
            this.onSectionRemove(section);
            return section;
        },
        onSectionRemove: function() {},

        getById: function(sectionId){
            var f = array.filter(this.sections, function (section) { return section.id === sectionId });
            return f.length > 0 ? f[0] : null;
        },

        _setMap: function (map, layerContainer) {
            this.inherited(arguments);
            this._map = map;
            this._div = domConstruct.create("div", null, layerContainer);
            var style = {
                position: "absolute",
                width: map.width + "px",
                height: map.height + "px",
                overflow: "visible",
                opacity: this.opacity
            };
            "css-transforms" === map.navigationMode ?
                (style[kernel._css.names.transform] = kernel._css.translate(map.__visibleDelta.x, map.__visibleDelta.y), domStyle.set(this._div, style), this._left = map.__visibleDelta.x, this._top = map.__visibleDelta.y) :
                (style.left = "0px", styleh.top = "0px", domStyle.set(this._div, style), this._left = this._top = 0);
            domStyle.set(this._div, style);
            if (!this._drawn) {
                this._drawn = true;
                this._refresh();
            }

            this._connect(this._map);
            return this._div;
        },

        _unsetMap: function () {
            this._disconnect();
            domConstruct.destroy(this._div);
            this._map = this._div = this.sections = this.drawn = null;
            this.inherited(arguments);
        },

        _connect: function(map){
            this._onPanStartHandler_connect = dojoConnect.connect(map, "onPanStart", this, this._onPanStartHandler);
            this._onPanHandler_connect = dojoConnect.connect(map, "onPan", this, this._onPanHandler);
            this._onPanEndHandler_connect = dojoConnect.connect(map, "onPanEnd", this, this._onPanEndHandler);
            this._onZoomStartHandler_connect = dojoConnect.connect(map, "onZoomStart", this, this._onZoomStartHandler);
            this._onZoomHandler_connect = dojoConnect.connect(map, "onZoom", this, this._onZoomHandler);
            this._onZoomEndHandlers_connect = dojoConnect.connect(map, "onZoomEnd", this, this._onZoomEndHandler);
            this._onScaleHandler_connect = dojoConnect.connect(map, "onScale", this, this._onScaleHandler);
            this._onResizeHandler_connect = dojoConnect.connect(map, "onResize", this, this._onResizeHandler);
            this._onExtentChangeHandler_connect = dojoConnect.connect(map, "onExtentChange", this, this._onExtentChangeHandler);
        },

        _disconnect: function(){
            dojoConnect.disconnect(this._onPanStartHandler_connect);
            dojoConnect.disconnect(this._onPanHandler_connect);
            dojoConnect.disconnect(this._onPanEndHandler_connect);
            dojoConnect.disconnect(this._onZoomStartHandler_connect);
            dojoConnect.disconnect(this._onZoomHandler_connect);
            dojoConnect.disconnect(this._onZoomEndHandlers_connect);
            dojoConnect.disconnect(this._onScaleHandler_connect);
            dojoConnect.disconnect(this._onResizeHandler_connect);
            dojoConnect.disconnect(this._onExtentChangeHandler_connect);
        },

        _refresh: function () {
            var section;
            for (var i = 0, len = this.sections.length; i < len; i++) {
                section = this.sections[i];
                this._drawSection(section);
            }
        },

        refresh: function(){
            this._refresh();
        },

        setOpacity: function (opacity) {
            this.opacity = opacity;
            domStyle.set(this._div, { opacity: this.opacity });
        },

        _onPanStartHandler: function () {
            this.hide();
        },

        _onPanHandler: function () {
            this.hide();
        },

        _onPanEndHandler: function () {
            this._refresh();
            this.show();
        },

        _onZoomStartHandler: function () {
            this.hide();
        },

        _onZoomHandler: function () {
            this.hide();
        },

        _onZoomEndHandler: function () {
            this._refresh();
            this.show();
        },

        _onResizeHandler: function () {
            domStyle.set(this._div, {
                width: this._map.width + 'px',
                height: this._map.height + 'px'
            });
            this._refresh();
            this.show();
        },

        _onScaleHandler: function () {
            this._refresh();
            this.show();
        },

        _onExtentChangeHandler: function () {
            this._refresh();
            this.show();
        },

        _onSuspend: function () {
            this._disconnect();
            this.hide();
        },

        _onResume: function () {
            this._connect(this._map);
            this.show();
        },

    });

    return clazz;
});