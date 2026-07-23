<?php
/**
 * =====================================================================
 * COMPONENTE: modal.php
 * Estructura de ventana modal genérica reutilizable en todo el sistema.
 * =====================================================================
 */
?>
<div class="modal-overlay" id="app-modal" style="display: none;">
  <div class="modal-card">
    <header class="modal-header">
      <h3 class="modal-title" id="modal-title">Título del Modal</h3>
      <button class="modal-close-btn" id="modal-close-btn" aria-label="Cerrar modal">&times;</button>
    </header>
    <div class="modal-body" id="modal-body">
      <!-- El contenido dinámico se inyectará aquí desde JavaScript -->
    </div>
    <footer class="modal-footer" id="modal-footer">
      <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
      <button class="btn btn-primary" id="modal-confirm-btn">Confirmar</button>
    </footer>
  </div>
</div>
