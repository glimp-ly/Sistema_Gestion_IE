<?php
    class Router {
        private array $rutas = [];

        // Registrar rutas GET
        public function get(string $ruta, callable|array $handler): void {
            $this->addRuta('GET', $ruta, $handler);
        }

        // Registrar rutas POST
        public function post(string $ruta, callable|array $handler): void {
            $this->addRuta('POST', $ruta, $handler);
        }

        // Método privado para registrar cualquier verbo HTTP
        private function addRuta(string $metodo, string $ruta, callable|array $handler): void {
            $this->rutas[$metodo][$this->convertirARegex($ruta)] = [
                'handler' => $handler,
                'original_path' => $ruta
            ];
        }

        /**
         * Convierte una ruta amigable como '/alumnos/editar/{id}' 
         * en un regex como '~^/alumnos/editar/(?P<id>[a-zA-Z0-9_-]+)$~'
         */
        private function convertirARegex(string $ruta): string {
            // Reemplaza {parametro} por un grupo de captura nombrado en Regex
            $patron = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[a-zA-Z0-9_-]+)', $ruta);
            
            // Delimitamos la expresión regular indicando inicio (^) y fin ($)
            return '~^' . $patron . '$~';
        }

        // Resolver la petición HTTP entrante
        public function resolver(string $uri, string $metodo) {
            // Limpiar parámetros query string (?ref=123)
            $path = parse_url($uri, PHP_URL_PATH);

            if (!isset($this->rutas[$metodo])) {
                $this->enviar404();
                return;
            }

            // Iterar sobre las rutas registradas para el método HTTP
            foreach ($this->rutas[$metodo] as $regex => $datos) {
                if (preg_match($regex, $path, $matches)) {
                    // Filtrar los matches para conservar solo las claves de texto (parámetros nombrados)
                    $parametros = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                    return $this->ejecutarHandler($datos['handler'], $parametros);
                }
            }

            // Si ninguna regla coincide
            $this->enviar404();
        }

        // Ejecuta el controlador o la función anónima pasando los parámetros
        private function ejecutarHandler(callable|array $handler, array $parametros) {
            if (is_array($handler)) {
                [$controllerClass, $method] = $handler;
                $instancia = new $controllerClass();
                // Llama al método pasando los parámetros extraídos
                return call_user_func_array([$instancia, $method], $parametros);
            }

            // Si es una función anónima (Closure)
            return call_user_func_array($handler, $parametros);
        }

        private function enviar404(): void {
            http_response_code(404);
            echo "404 - Página no encontrada";
        }
}

