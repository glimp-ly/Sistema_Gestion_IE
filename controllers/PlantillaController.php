<?php

require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/PlantillaModel.php';

class PlantillaController
{
    private PlantillaModel $model;
    private const MAX_FILE_SIZE = 65535; // Límite real de la columna BLOB existente
    private const EXTENSIONES = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
    private const MIMES_PERMITIDOS = [
        'pdf'  => ['application/pdf'],
        'doc'  => ['application/msword', 'application/octet-stream', 'application/x-ole-storage', 'application/vnd.ms-office', 'application/cdfv2'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
        'xls'  => ['application/vnd.ms-excel', 'application/octet-stream', 'application/x-ole-storage', 'application/vnd.ms-office', 'application/cdfv2'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream'],
    ];

    public function __construct()
    {
        $this->model = new PlantillaModel(Conexion::connection());
    }

    public function handleRequest(string $method, array $payload = [], array $files = []): array
    {
        $idAdministrativo = $this->obtenerIdAdministrativoActual();

        if ($method === 'GET') {
            return $this->respuesta(true, 'Plantillas cargadas correctamente.', $this->model->listarPorAdministrativo($idAdministrativo));
        }

        if ($method === 'POST') {
            $categoria = trim((string)($payload['categoria'] ?? ''));
            $archivo = $files['archivo'] ?? null;

            if ($categoria === '' || strlen($categoria) > 50) {
                return $this->respuesta(false, 'La categoría es obligatoria y no puede superar 50 caracteres.', null, 422);
            }
            if (!is_array($archivo) || ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                return $this->respuesta(false, 'Seleccione un archivo válido.', null, 422);
            }

            $nombre = basename((string)($archivo['name'] ?? ''));
            $extension = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
            $tamano = (int)($archivo['size'] ?? 0);

            if ($nombre === '' || strlen($nombre) > 50) {
                return $this->respuesta(false, 'El nombre del archivo debe contener como máximo 50 caracteres.', null, 422);
            }
            if (!in_array($extension, self::EXTENSIONES, true)) {
                return $this->respuesta(false, 'Solo se permiten archivos PDF, Word o Excel.', null, 422);
            }
            if ($tamano <= 0 || $tamano > self::MAX_FILE_SIZE) {
                return $this->respuesta(false, 'El archivo debe pesar como máximo 64 KB porque la base usa una columna BLOB.', null, 422);
            }

            $tmpName = (string)($archivo['tmp_name'] ?? '');
            if ($tmpName === '' || !is_uploaded_file($tmpName)) {
                return $this->respuesta(false, 'La carga del archivo no es válida.', null, 422);
            }

            if (!class_exists('finfo')) {
                return $this->respuesta(false, 'La extensión Fileinfo de PHP debe estar habilitada en XAMPP.', null, 500);
            }
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeReal = strtolower((string)$finfo->file($tmpName));
            if (!in_array($mimeReal, self::MIMES_PERMITIDOS[$extension] ?? [], true)) {
                return $this->respuesta(false, 'El contenido del archivo no coincide con su extensión.', null, 422);
            }

            $contenido = file_get_contents($tmpName);
            if ($contenido === false) {
                return $this->respuesta(false, 'No se pudo leer el archivo cargado.', null, 422);
            }

            $registro = $this->model->crear($idAdministrativo, $nombre, $categoria, $contenido);
            return $this->respuesta(true, 'Plantilla cargada correctamente.', $registro, 201);
        }

        if ($method === 'DELETE') {
            $idPlantilla = (int)($payload['id_plantilla'] ?? 0);
            if ($idPlantilla <= 0) {
                return $this->respuesta(false, 'La plantilla indicada no es válida.', null, 422);
            }
            if (!$this->model->eliminar($idAdministrativo, $idPlantilla)) {
                return $this->respuesta(false, 'La plantilla no existe o no pertenece al usuario.', null, 404);
            }
            return $this->respuesta(true, 'Plantilla eliminada correctamente.', ['id_plantilla' => $idPlantilla]);
        }

        return $this->respuesta(false, 'Método no permitido.', null, 405);
    }

    public function obtenerArchivoParaDescarga(int $idPlantilla): ?array
    {
        $idAdministrativo = $this->obtenerIdAdministrativoActual();
        return $this->model->obtenerArchivo($idAdministrativo, $idPlantilla);
    }

    private function obtenerIdAdministrativoActual(): int
    {
        $idCredencial = (int)($_SESSION['usuario_id'] ?? 0);
        $rol = strtolower(trim((string)($_SESSION['rol_nombre'] ?? '')));
        if ($idCredencial <= 0) {
            throw new RuntimeException('La sesión no está activa.');
        }
        if (!in_array($rol, ['director', 'administrador', 'admin'], true)) {
            throw new RuntimeException('No tiene permisos para gestionar plantillas.');
        }

        $idAdministrativo = $this->model->obtenerIdAdministrativoPorCredencial($idCredencial);
        if (!$idAdministrativo) {
            throw new RuntimeException('La cuenta no está vinculada con la tabla ADMINISTRATIVO.');
        }
        return $idAdministrativo;
    }

    private function respuesta(bool $success, string $message, mixed $data = null, int $status = 200): array
    {
        return compact('success', 'message', 'data', 'status');
    }
}
