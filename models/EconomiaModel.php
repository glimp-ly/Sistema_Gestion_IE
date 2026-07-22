<?php
class EconomiaModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function ensureTable(): void
    {
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS configuracion_economica (" .
            "id INT AUTO_INCREMENT PRIMARY KEY, " .
            "pension_promedio INT NOT NULL DEFAULT 350, " .
            "num_alumnos INT NOT NULL DEFAULT 120, " .
            "morosidad_pct INT NOT NULL DEFAULT 15, " .
            "sueldo_docente_prom INT NOT NULL DEFAULT 1800, " .
            "gastos_mantenimiento INT NOT NULL DEFAULT 2500, " .
            "gasto_internet INT NOT NULL DEFAULT 320, " .
            "gasto_agua INT NOT NULL DEFAULT 250, " .
            "gasto_luz INT NOT NULL DEFAULT 450, " .
            "gasto_impuestos INT NOT NULL DEFAULT 1800, " .
            "fondo_reserva_pct INT NOT NULL DEFAULT 5, " .
            "fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM configuracion_economica");
        if ((int)$stmt->fetchColumn() === 0) {
            $this->pdo->exec(
                "INSERT INTO configuracion_economica (pension_promedio, num_alumnos, morosidad_pct, sueldo_docente_prom, gastos_mantenimiento, gasto_internet, gasto_agua, gasto_luz, gasto_impuestos, fondo_reserva_pct) " .
                "VALUES (350, 120, 15, 1800, 2500, 320, 250, 450, 1800, 5)"
            );
        }
    }

    public function getMetrics(): array
    {
        $this->ensureTable();

        $stmt = $this->pdo->query("SELECT * FROM configuracion_economica ORDER BY id ASC LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $docentStmt = $this->pdo->query("SELECT COUNT(*) AS total FROM docentes WHERE es_activo = 1");
        $docentRow = $docentStmt->fetch(PDO::FETCH_ASSOC);
        $numDocentes = (int)($docentRow['total'] ?? 0);
        if ($numDocentes <= 0) {
            $numDocentes = 6;
        }

        $config['num_docentes_activos'] = $numDocentes;
        return $config;
    }

    public function updateMetrics(array $data): array
    {
        $this->ensureTable();

        $pension = max(50, (int)($data['pension_promedio'] ?? 350));
        $numAlumnos = max(10, (int)($data['num_alumnos'] ?? 120));
        $morosidad = max(0, min(100, (int)($data['morosidad_pct'] ?? 15)));
        $sueldoDocente = max(500, (int)($data['sueldo_docente_prom'] ?? 1800));
        $mantenimiento = max(0, (int)($data['gastos_mantenimiento'] ?? 2500));
        $internet = max(0, (int)($data['gasto_internet'] ?? 320));
        $agua = max(0, (int)($data['gasto_agua'] ?? 250));
        $luz = max(0, (int)($data['gasto_luz'] ?? 450));
        $impuestos = max(0, (int)($data['gasto_impuestos'] ?? 1800));
        $reserva = max(0, min(50, (int)($data['fondo_reserva_pct'] ?? 5)));

        $stmt = $this->pdo->prepare(
            "UPDATE configuracion_economica SET " .
            "pension_promedio = ?, num_alumnos = ?, morosidad_pct = ?, sueldo_docente_prom = ?, " .
            "gastos_mantenimiento = ?, gasto_internet = ?, gasto_agua = ?, gasto_luz = ?, " .
            "gasto_impuestos = ?, fondo_reserva_pct = ? WHERE id = 1"
        );

        $stmt->execute([
            $pension,
            $numAlumnos,
            $morosidad,
            $sueldoDocente,
            $mantenimiento,
            $internet,
            $agua,
            $luz,
            $impuestos,
            $reserva
        ]);

        return $this->getMetrics();
    }
}
