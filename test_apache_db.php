<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Testing Connection:\n";
try {
    require_once 'core/database.php';
    $pdo = Conexion::connection();
    echo "Connection successful!\n";
    
    echo "2. Querying docentes:\n";
    require_once 'models/DocenteModel.php';
    $model = new DocenteModel($pdo);
    $data = $model->getAll();
    echo "Docentes found: " . count($data) . "\n";
    print_r($data);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
