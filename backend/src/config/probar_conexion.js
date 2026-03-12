const pool = require("./base_datos");

async function probar() {
  try {
    const resultado = await pool.query("SELECT NOW() AS fecha_actual");
    console.log("✅ Conexión exitosa. Fecha:", resultado.rows[0].fecha_actual);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    process.exit(1);
  }
}

probar();
