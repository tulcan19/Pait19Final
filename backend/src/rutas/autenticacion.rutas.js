const express = require("express");
const router = express.Router();

const autenticacionControlador = require("../modulos/autenticacion/autenticacion.controlador");

router.post("/login", autenticacionControlador.login);
router.post("/registro", autenticacionControlador.registro);

module.exports = router;
