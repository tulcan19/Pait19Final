const bcrypt = require("bcryptjs");
const pool = require("./base_datos");

async function verificarYCrearUsuario() {
  try {
    console.log("🔍 Verificando conexión a la base de datos...");
    
    // Verificar conexión
    await pool.query("SELECT NOW()");
    console.log("✅ Conexión a la base de datos exitosa\n");

    // Verificar si existe el usuario
    const correo = "admin@sierrastock.com";
    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE LOWER(TRIM(correo)) = $1",
      [correo.toLowerCase()]
    );

    if (resultado.rows.length > 0) {
      const usuario = resultado.rows[0];
      console.log("👤 Usuario encontrado:");
      console.log(`   ID: ${usuario.id_usuario}`);
      console.log(`   Nombre: ${usuario.nombre}`);
      console.log(`   Correo: ${usuario.correo}`);
      console.log(`   Activo: ${usuario.activo}`);
      console.log(`   Contraseña (hash): ${usuario.contrasena.substring(0, 20)}...`);

      // Verificar si la contraseña es un hash
      const esHash = usuario.contrasena.startsWith("$2a$") || usuario.contrasena.startsWith("$2b$");
      
      if (!esHash) {
        console.log("\n⚠️  La contraseña NO está hasheada. Actualizando...");
        const hash = await bcrypt.hash("123456", 10);
        await pool.query(
          "UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2",
          [hash, usuario.id_usuario]
        );
        console.log("✅ Contraseña actualizada con hash bcrypt");
      } else {
        // Probar si el hash funciona
        const valida = await bcrypt.compare("123456", usuario.contrasena);
        if (valida) {
          console.log("\n✅ La contraseña '123456' es válida");
        } else {
          console.log("\n⚠️  El hash no coincide con '123456'. Actualizando...");
          const hash = await bcrypt.hash("123456", 10);
          await pool.query(
            "UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2",
            [hash, usuario.id_usuario]
          );
          console.log("✅ Contraseña actualizada");
        }
      }
    } else {
      console.log("❌ Usuario NO encontrado. Creando usuario administrador...");
      
      // Verificar si existe el rol Administrador
      const rolResult = await pool.query(
        "SELECT id_rol FROM roles WHERE nombre = 'Administrador'"
      );
      
      let idRol;
      if (rolResult.rows.length > 0) {
        idRol = rolResult.rows[0].id_rol;
      } else {
        // Crear rol si no existe
        const nuevoRol = await pool.query(
          "INSERT INTO roles (nombre) VALUES ('Administrador') RETURNING id_rol"
        );
        idRol = nuevoRol.rows[0].id_rol;
        console.log("✅ Rol 'Administrador' creado");
      }

      // Crear usuario
      const hash = await bcrypt.hash("123456", 10);
      const nuevoUsuario = await pool.query(
        `INSERT INTO usuarios (nombre, correo, contrasena, id_rol, activo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_usuario, nombre, correo`,
        ["Administrador", correo, hash, idRol, true]
      );
      
      console.log("✅ Usuario creado exitosamente:");
      console.log(`   ID: ${nuevoUsuario.rows[0].id_usuario}`);
      console.log(`   Nombre: ${nuevoUsuario.rows[0].nombre}`);
      console.log(`   Correo: ${nuevoUsuario.rows[0].correo}`);
    }

    console.log("\n📋 Credenciales de acceso:");
    console.log("   Correo: admin@sierrastock.com");
    console.log("   Contraseña: 123456");
    console.log("\n✅ Verificación completada");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nDetalles:", error);
    process.exit(1);
  }
}

verificarYCrearUsuario();
