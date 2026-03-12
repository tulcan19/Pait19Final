const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credenciales proporcionadas por el usuario en la captura
const client = new Client({
    host: 'caboose.proxy.rlwy.net',
    port: 44950,
    user: 'postgres',
    password: 'yeolbhtbvfGxRkYQMjYUfWPUidgbpYCQ', // Sin espacio, asumiendo kerning
    database: 'railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrar() {
    try {
        console.log("Intentando conectar a Railway...");
        await client.connect();
        console.log("¡Conexión exitosa!");

        const sqlPath = path.join(__dirname, 'pait19.sql');
        console.log(`Leyendo archivo SQL: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Ejecutando script SQL (esto puede tardar unos segundos)...");
        await client.query(sql);
        console.log("--------------------------------------------------");
        console.log("✅ BASE DE DATOS SINCRONIZADA CORRECTAMENTE");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ ERROR DURANTE LA MIGRACIÓN:");
        console.error(error.message);
        if (error.message.includes('authentication failed')) {
            console.log("Sugerencia: Revisar si la contraseña tiene un espacio o caracteres especiales.");
        }
    } finally {
        await client.end();
    }
}

migrar();
