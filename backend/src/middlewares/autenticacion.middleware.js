const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  try {
    // 1) Intentar desde Header Authorization: Bearer xxx
    const authHeader = req.headers.authorization;

    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2) Si no hay token en header, intentar desde query ?token=xxx
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ mensaje: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRETO);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

module.exports = { verificarToken };
