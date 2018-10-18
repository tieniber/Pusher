/*global logger,Pusher,define,require,mx*/
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
    "Pusher/lib/Pusher4"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, widgetTemplate, pusherLink) {
    "use strict";

    // Declare widget's prototype.
    return declare("Pusher.widget.Pusher", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements

        // Parameters configured in the Modeler.
        pusherAPIKey:"",
        cluster:"",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _socket: null,
        _readOnly: false,

        _apiKey: null,
        _channel: null,

		
        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            // Uncomment the following line to enable debug messages
            //logger.level(logger.DEBUG);
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
                this._readOnly = true;
            }

        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._setupPusher();
            //this._resetSubscriptions();
            this._executeCallback(callback);
        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
            if (this._socket && typeof this._socket.disconnect === "function"){
                this._socket.disconnect();
            }
        },

        _callRefresh: function(){

        },

        // Attach events to HTML dom elements
        _setupPusher: function () {
            logger.debug(this.id + "._setupPusher");
            this._apiKey = this.pusherAPIKey;

            // Throw an error if an empty apiKey is provided
            if(this._contextObj && this.pusherAPIKeyAttr && this._contextObj.get(this.pusherAPIKeyAttr) !== ""){
                this._apiKey = this._contextObj.get(this.pusherAPIKeyAttr);
            }
            
            // close the current connection, if it exists.
            if (this._socket && typeof this._socket.disconnect === "function"){
                this._socket.disconnect();
            }

            this._socket = new Pusher(this._apiKey,{
                encrypted: true,
                cluster: this.cluster
            });
            this._channel = this._socket.subscribe(this._contextObj.getGuid()); //channel name is context object GUID
            this._channel.bind("call_microflow", this._call_microflow.bind(this)); 
            this._channel.bind("refresh_object_class", this._refresh_object_class.bind(this)); 
            this._channel.bind("refresh_object", this._refresh_object.bind(this)); 
        },

        _call_microflow: function(/*data*/) {
            mx.data.action({
                params: {
                    applyto: "selection",
                    actionname: this.microflow,
                    guids: [this._contextObj.getGuid()]
                },
                origin: this.mxform,
                callback: function() {
                },
                error: function(error) {
                    alert(error.message);
                }
            });
        },

        _refresh_object: function() {
            //mx.data.updateInCache(data);
            //mx.data.update({guid: data.guid});
        },

        _refresh_object_class: function() {
            //mx.data.update({entity: data.objectType});
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function () {
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

