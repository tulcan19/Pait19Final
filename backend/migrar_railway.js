const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'caboose.proxy.rlwy.net',
    port: 44950,
    user: 'postgres',
    password: 'yeolbhtbvfGxRkYQMjYUfWPUidgbpYCQ',
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

        const sqlPath = path.join(__dirname, '..', 'pait19.sql');
        console.log(`Leyendo archivo SQL: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Sincronizando base de datos...");
        await client.query(sql);
        console.log("--------------------------------------------------");
        console.log("✅ BASE DE DATOS SINCRONIZADA CORRECTAMENTE");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ ERROR DURANTE LA MIGRACIÓN:");
        console.error(error.message);
    } finally {
        await client.end();
    }
}

migrar();
