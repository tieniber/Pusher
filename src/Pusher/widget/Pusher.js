/*global logger*/
/*
    DualScreen
    ========================

    @file      : DualScreen.js
    @version   : 1.0.0
    @author    : Pieter van de Braak
    @date      : 2017-02-12
    @copyright : CAPE Groep 2017
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "dojo/text!Pusher/widget/template/Pusher.html",
	"https://js.pusher.com/4.0/pusher.min.js"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, widgetTemplate, pusherLink) {
    "use strict";

    // Declare widget's prototype.
    return declare("Pusher.widget.Pusher", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        openFormButton: null,

        // Parameters configured in the Modeler.
        urlToOpen: "",
        buttonCaption: "",
        pusherAPIKey:"",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _socket: null,
        _readOnly: false,
        _windows: null,
        _dataListeners: null,

		
        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
            this._windows = [];
            this._dataListeners = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
              this._readOnly = true;
            }
            dojoArray.forEach(this.ignored1, dojoLang.hitch(this, function (dataListener) {
                this._dataListeners.push([ dataListener.dataEntity, dataListener.channelName ]);
            }));
            this._updateRendering();
            this._setupEvents();

        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            if (this._windows){
              dojoArray.forEach(this._windows, function (window){
                  window.close();
              });
              this._windows = [];
          }
        },

        _callRefresh: function(){

        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");
            this._socket = new Pusher(this.pusherAPIKey,{
                                                         encrypted: true
                                                        });
            dojoArray.forEach(this._dataListeners, dojoLang.hitch(this, function (dataListener) {
                var channel = this._socket.subscribe(dataListener[1]);
                channel.bind('refresh_object', function(data) {
                //Implement logic here to refresh single object
                console.log(data);
                mx.data.update({guid: data.guid});
                });
                channel.bind('refresh_object_class', function(data) {
                //Implement logic here to refresh single object
                console.log(data);
                mx.data.update({entity: data.entityType});
                });       
            }));
            
/*
            this.connect(this.infoTextNode, "click", function (e) {
                // Only on mobile stop event bubbling!

                // If a microflow has been set execute the microflow on a click.
                if (this.mfToExecute !== "") {
                    mx.data.action({
                        params: {
                            applyto: "selection",
                            actionname: this.mfToExecute,
                            guids: [ this._contextObj.getGuid() ]
                        },
                        store: {
                            caller: this.mxform
                        },
                        callback: function (obj) {
                            //TODO what to do when all is ok!
                        },
                        error: dojoLang.hitch(this, function (error) {
                            logger.error(this.id + ": An error occurred while executing microflow: " + error.description);
                        })
                    }, this);
                }
            });*/
        },
        
        _addWindow: function (){
            if (this.urlToOpen != ""){
            var url = this.urlToOpen.replace('\{Id\}',this._contextObj.getGuid());
            this._windows.push(window.open(url));

            }
            else throw "No URL has been defined."
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
            this.openFormButton.textContent = this.buttonCaption;
            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            this._executeCallback(callback);
        },


        _unsubscribe: function () {
          if (this._handles) {
              dojoArray.forEach(this._handles, function (handle) {
                  this.unsubscribe(handle);
              });
              this._handles = [];
          }
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this._unsubscribe();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function (guid) {
                        this._callRefresh();
                    })
                });

                this._handles = [objectHandle];
            }
        },

        _executeCallback: function (cb) {
          if (cb && typeof cb === "function") {
            cb();
          }
        }
    });
});

require(["Pusher/widget/Pusher"]);

