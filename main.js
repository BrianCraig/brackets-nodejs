define(function (require, exports, module) {
    "use strict";

    var procesos = {};

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        CommandManager = brackets.getModule("command/CommandManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        NodeDomain = brackets.getModule("utils/NodeDomain");

    /* Conexión */

    var nodeConnection = new NodeConnection();
    var path = ExtensionUtils.getModulePath(module, "main.proc");
    $(nodeConnection).on("simple.log", function (evt, ret) {
        if (ret.tipo === "cierre")
            procesos[ret.src] = false;
        toolbar.actualizar();
        if (ret.tipo === "texto")
            salida.appendOutput(ret.texto);
    });
    nodeConnection.connect(true);
    nodeConnection.loadDomains([path], true);

    /* Funciones */

    function iniciarApp(src) {
        nodeConnection.domains.simple.enviar({
            tipo: "iniciarApp",
            src: src
        }, function () {});
        procesos[src] = true;
        toolbar.actualizar();
    }

    function terminarApp(src) {
        nodeConnection.domains.simple.enviar({
            tipo: "terminarApp",
            src: src
        }, function () {})
    }

    function terminarApps() {
        nodeConnection.domains.simple.enviar({
            tipo: "terminarApps"
        }, function () {});
    }


    /* Icono */
    var toolbar = {
        elemento: null,
        iniciar: function () {
            ExtensionUtils.loadStyleSheet(module, 'estilo.css');
            $("#main-toolbar .buttons").append('<a href="#" id="nodejs-toolbar" class="nodejs-toolbar-gris"></a>');
            this.elemento = $('#nodejs-toolbar');
            this.elemento.on("click", toolbar.click);
        },
        estado: function (color) {
            this.elemento.removeClass().addClass('nodejs-toolbar-' + color);
        },
        click: function () {
            var doc = DocumentManager.getCurrentDocument();
            if (!doc.file.isFile) return;
            var doc = doc.file.fullPath
            if (procesos[doc] === undefined) //no existe
                iniciarApp(doc);
            else if (procesos[doc] === true) // encendido
                terminarApp(doc);
            else if (procesos[doc] === false) // apagado
                iniciarApp(doc);
        },
        actualizar: function () {
            var doc = DocumentManager.getCurrentDocument();
            if (!doc.file.isFile) return;
            var doc = doc.file.fullPath
            if (procesos[doc] === undefined) //no existe
                toolbar.estado("gris");
            if (procesos[doc] === true) // encendido
                toolbar.estado("verde");
            if (procesos[doc] === false) // apagado
                toolbar.estado("rojo");
        }
    }
    toolbar.iniciar();

    $(DocumentManager).on("currentDocumentChange", function () {
        toolbar.actualizar();
    });

    /* Panel inferior */
    var salida = {
        PanelManager: brackets.getModule("view/PanelManager"),
        panelOutHtml: require("text!html/panel_output.html"),
        panelOut: null,
        elem: null,
        boton: null,
        appendOutput: function (output) {
            if (!this.panelOut) {
                this.panelOut = this.PanelManager.createBottomPanel('braincraig.nodejs.output', $(this.panelOutHtml));
                $('.close', $('#brackets-cmd-runner-output')).click(function () {
                    salida.panelOut.hide();
                });
                $('#status-indicators').prepend('<div id="briancraig-nodejs-toggle">Node</div>');
                this.boton = $('#briancraig-nodejs-toggle');
                this.boton.click(function () {
                    if (salida.panelOut.isVisible())
                        salida.panelOut.hide();
                    else
                        salida.panelOut.show();
                });
                this.elem = $('#brackets-cmd-runner-console');
            }
            output = output || '';
            this.elem.append('<p>' + Mustache.render('{{row}}', {
                row: output
            }) + '</p>');
            this.elem.animate({
                scrollTop: this.elem[0].scrollHeight
            }, "fast");
        }
    }
});