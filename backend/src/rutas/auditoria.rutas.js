const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { asyncHandler } = require("../utils/manejoErrores");
const { obtenerAuditoria } = require("../utils/auditoria");

/**
 * Obtener historial de auditoría
 * Solo para administradores
 */
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador"),
  asyncHandler(async (req, res) => {
    const filtros = {
      usuario_id: req.query.usuario_id ? Number(req.query.usuario_id) : undefined,
      modulo: req.query.modulo,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      limite: req.query.limite ? Number(req.query.limite) : 100,
    };

    const registros = await obtenerAuditoria(filtros);

    return res.json({
      ok: true,
      registros,
      total: registros.length,
    });
  })
);

module.exports = router;
