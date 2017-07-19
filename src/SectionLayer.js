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
  "./Section",
],
function (declare, lang, dojoConnect, array, topic, dom, domConstruct, domStyle, kernel,
    screenUtils, Layer, Section) {
    /* SectionLayer 用于在地图上显示任何用户自定义的展示内容，包括标签、图标等信息 */
    var clazz = declare(Layer, {

        declaredClass: 'esri.layers.SectionLayer',

        opacity: 1,

        constructor: function () {
            this.sections = [];

            this.registerConnectEvents();
            this._drawn = false;
            this.loaded = true;
            this.onLoad(this);
        },


        add: function (section) {
            if (section._layer === this) return section;
            if (this.sections.indexOf(section) < 0) {
                !section.id && (section.setId(this._createSectionId(this.sections.length)));
                this.sections.push(section);
            } else return section;

            section._setLayer(this);
            this._drawSection(section);
            this.onSectionAdd(section);

            return section;
        },
        onSectionAdd: function(){},

        _createSectionId: function(idx){
            return 'section_' + idx;
        },

        _drawSection: function (section) {
            if (!this._drawn) return;
            
            var screenPt = screenUtils.toScreenPoint(this._map.extent, this._map.width, this._map.height, section._position);
            domStyle.set(section._div, {
                "left": screenPt.x + section.offset.x + "px",
                "top": screenPt.y + section.offset.y + "px"
            });
            section._bindContent();
            domConstruct.place(section._div, this._div);
            section._drawn = true;
        },

        setRelativeLayer: function(relativeLayer){
            this._relativeLayer = relativeLayer;
            this._relativeLayerVisibilityChange = relativeLayer.on('visibility-change', lang.hitch(this, function (evt) {
                this.setVisibility(evt.visible);
            }));
            this._relativeLayerScaleVisibilityChange = relativeLayer.on('scale-visibility-change', lang.hitch(this, function (evt) {
                this.setVisibility(relativeLayer.visibleAtMapScale);
            }));
        },

        removeRelativeLayer:function(){
            this._relativeLayerVisibilityChange && this._relativeLayerVisibilityChange.remove();
            this._relativeLayerScaleVisibilityChange && this._relativeLayerScaleVisibilityChange.remove();
            this._relativeLayer = null;
        },

        clear: function () {
            this.sections = [];
            this._div.clear();
            this.onSectionClear()
        },
        onSectionClear: function(){},

        remove: function (section) {
            var index;
            if (-1 === (index = array.indexOf(this.sections, section)))
                return null;
            section = this.sections.splice(index, 1)[0];
            section._setLayer(null);
            domConstruct.destroy(section.getNode());
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
            domStyle.set(this._div, style);
            if (!this._drawn) {
                this._drawn = true;
                this._refresh();
            }
            this._div.clear = lang.hitch(this, function(){  
                domConstruct.empty(this._div); 
            });
            this.evaluateSuspension();
            this.enableMouseEvents();
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
            this._onResizeHandler_connect = dojoConnect.connect(map, "onResize", this, this._onResizeHandler);
            this._onExtentChangeHandler_connect = dojoConnect.connect(map, "onExtentChange", this, this._onExtentChangeHandler);           
        },

        _disconnect: function(){
            dojoConnect.disconnect(this._onResizeHandler_connect);
            dojoConnect.disconnect(this._onExtentChangeHandler_connect);
        },

        _refresh: function () {
            var section;
            if (this.sections &&　this.sections.length > 0)
            {
                this._div.clear && this._div.clear();
                for (var i = 0, len = this.sections.length; i < len; i++) {
                    section = this.sections[i];
                    if(section._viewInExtent(this._map.extent)){
                        this._drawSection(section);
                    }
                }
            }
        },

        refresh: function(){
            this._map && this._onExtentChangeHandler(this._map.extent)
        },

        setOpacity: function (opacity) {
            this.opacity = opacity;
            domStyle.set(this._div, { opacity: this.opacity });
        },

        setVisibility: function(visible){
            this.inherited(arguments);
            domStyle.set(this._div, "display", visible ? "block" : "none");
        },

        _onResizeHandler: function () {
            domStyle.set(this._div, {
                width: this._map.width + 'px',
                height: this._map.height + 'px'
            });
            this._onExtentChangeHandler();
        },

        _onExtentChangeHandler: function () {
            if(!this.suspended){
                this._refresh();
            }
        },

        _onMouseOverHandler: function(e){
            this.onMouseOver(e);
        },
        onMouseOver: function(){},

        _onMouseMoveHandler: function(e){
            this.onMouseMove(e);
        },
        onMouseMove: function(){},

        _onMouseOutHandler: function(e){
            this.onMouseOut(e);
        },
        onMouseOut: function(){},

        _onMouseDownHandler: function(e){
            this.onMouseDown(e);
        },
        onMouseDown: function(){},

        _onMouseUpHandler: function(e){
            this.onMouseUp(e);
        },
        onMouseUp: function(){},

        _onClickHandler: function(e){
            this.onClick(e);
        },
        onClick: function(){},

        _onDbClickHandler: function(e){
            this.onDbClick(e);
        },
        onDbClick: function(){},

        enableMouseEvents: function(){
            if (!this._mouseEvents) {             
                this._onmouseover_connect = dojoConnect.connect(this._div, "onmouseover", this, this._onMouseOverHandler);
                this._onmousemove_connect = dojoConnect.connect(this._div, "onmousemove", this, this._onMouseMoveHandler);
                this._onmouseout_connect = dojoConnect.connect(this._div, "onmouseout", this, this._onMouseOutHandler);
                this._onmousedown_connect = dojoConnect.connect(this._div, "onmousedown", this, this._onMouseDownHandler);
                this._onmouseup_connect = dojoConnect.connect(this._div, "onmouseup", this, this._onMouseUpHandler);
                this._onclick_connect = dojoConnect.connect(this._div, "onclick", this, this._onClickHandler);
                this._ondblclick_connect = dojoConnect.connect(this._div, "ondblclick", this, this._onDbClickHandler);
                this._mouseEvents = true;
            }
        },
        disableMouseEvents: function(){
            if (this._mouseEvents) {
                dojoConnect.disconnect(this._onmouseover_connect);
                dojoConnect.disconnect(this._onmousemove_connect);
                dojoConnect.disconnect(this._onmouseout_connect);
                dojoConnect.disconnect(this._onmousedown_connect);
                dojoConnect.disconnect(this._onmouseup_connect);
                dojoConnect.disconnect(this._onclick_connect);
                dojoConnect.disconnect(this._ondblclick_connect);
                this._mouseEvents = false;
            }
        }

    });

    return clazz;
});
