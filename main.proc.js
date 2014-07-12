(function () {
    "use strict";
    var EE;
    var spawn = require('child_process').spawn;
    var procesos = {};


    /* Funcion que recibe los datos */
    function enviar(entrada, callback) {
        switch (entrada.tipo) {
        case "iniciarApp":
            procesos[entrada.src] = spawn(process.execPath, [entrada.src]);
            procesos[entrada.src].on("close", function (e) {
                EE("simple", "log", [{
                    tipo: "cierre",
                    src: entrada.src
                }]);
            });
            procesos[entrada.src].stdout.on('data', function (e) {
                EE("simple", "log", [{
                    tipo: "texto",
                    src: entrada.src,
                    texto: e + ''
                }]);
            });
            procesos[entrada.src].stderr.on('data', function (e) {
                EE("simple", "log", [{
                    tipo: "texto",
                    src: entrada.src,
                    texto: e + ''
                }]);
            });
            break;

        case "terminarApp":
            try {
                procesos[entrada.src].kill(); // SIGTERM
            } catch (e) {}
            break;
        case "terminarApps":
            for (var x in procesos) {
                try {
                    procesos[x].kill(); // SIGTERM
                } catch (e) {}
            }
            break;
        }
        callback(true);
    }



    /* Funcion inicializadora */
    function init(domainManager) {
        if (!domainManager.hasDomain("simple")) {
            domainManager.registerDomain("simple", {
                major: 0,
                minor: 1
            });
        }
        EE = domainManager.emitEvent;
        domainManager.registerCommand(
            "simple", // domain name
            "enviar", // command name
            enviar, // command handler function
            true,
            "Envia un comando", [
                {
                    name: "entrada",
                    type: "object"
                }
            ], [{
                name: "salida",
                type: "boolean"
            }]
        );
        domainManager.registerEvent(
            "simple",
            "log", [{
                name: "salida",
                type: "object"
            }]
        );
    }
    exports.init = init;

    /* Cerrar los procesos al finalizar */
    process.on('exit', function () {
        for (var x in procesos) {
            try {
                procesos[x].kill('SIGKILL'); // SIGTERM
            } catch (e) {}
        }
    });

}());
