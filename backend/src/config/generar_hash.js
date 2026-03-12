const bcrypt = require("bcryptjs");

async function generar() {
  const contrasena = "1234";
  const hash = await bcrypt.hash(contrasena, 10);
  console.log("HASH:", hash);
}

generar();
