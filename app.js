// ------------------------------
// IMPORTS Y CONFIGURACIÓN
// ------------------------------
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

const RUTA_USUARIOS = path.join(__dirname, "data", "usuarios.json");

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// FUNCIONES AUXILIARES
// ------------------------------
function leerUsuarios() {
  if (!fs.existsSync(RUTA_USUARIOS)) return [];
  const data = fs.readFileSync(RUTA_USUARIOS, "utf8");
  return JSON.parse(data || "[]");
}

function guardarUsuarios(lista) {
  fs.writeFileSync(RUTA_USUARIOS, JSON.stringify(lista, null, 2), "utf8");
}

// ------------------------------
// VARIABLES DE CONTROL DE INTENTOS
// ------------------------------
let intentosFallidos = {}; // { "usuario": cantidad }

// ------------------------------
// RUTAS DE PÁGINAS
// ------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/registrar", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "registrar.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// ------------------------------
// RUTA LOGIN
// ------------------------------
app.post("/login", (req, res) => {
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario || !password) {
    return res.json({ success: false, message: "Faltan datos." });
  }

  const usuarios = leerUsuarios();
  const usuario = usuarios.find(
    (u) => u.nombre_usuario === nombre_usuario && u.password === password
  );

  if (usuario) {
    intentosFallidos[nombre_usuario] = 0;
    return res.json({
      success: true,
      message: "Acceso exitoso.",
      rol: usuario.rol,
    });
  } else {
    // Manejo de intentos fallidos
    intentosFallidos[nombre_usuario] =
      (intentosFallidos[nombre_usuario] || 0) + 1;

    if (intentosFallidos[nombre_usuario] >= 4) {
      // Bloquea y ofrece recuperación
      return res.json({
        success: false,
        message:
          "Contraseña incorrecta 4 veces. Se puede resetear la contraseña.",
        recovery: true,
      });
    }

    return res.json({
      success: false,
      message: `Usuario o contraseña incorrectos. Intento ${intentosFallidos[nombre_usuario]}/4.`,
    });
  }
});

// ------------------------------
// RUTA DE REGISTRO DE USUARIO
// ------------------------------
app.post("/registrar", (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  if (!nombre_usuario || !email || !password) {
    return res.send("Todos los campos son obligatorios.");
  }

  const usuarios = leerUsuarios();

  // Validar duplicados
  if (usuarios.some((u) => u.email === email)) {
    return res.send(
      "<p class='mensaje-error'>❌ Ya existe un usuario con ese correo electrónico.</p>"
    );
  }

  if (usuarios.some((u) => u.nombre_usuario === nombre_usuario)) {
    return res.send(
      "<p class='mensaje-error'>❌ El nombre de usuario ya está en uso.</p>"
    );
  }

  // Validar fortaleza de contraseña
  const passwordFuerte =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!passwordFuerte) {
    return res.send(
      "<p class='mensaje-error'>❌ La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un símbolo.</p>"
    );
  }

  usuarios.push({ nombre_usuario, email, password });
  guardarUsuarios(usuarios);

  res.send(
    "<p class='mensaje-exito'>✅ Usuario registrado correctamente.</p><p style='margin-top: 10px;'><a href='/'>Volver al login</a></p>"
  );
});

// ------------------------------
// RUTA PARA RECUPERAR CONTRASEÑA (simulada)
// ------------------------------
app.post("/recuperar", (req, res) => {
  const { email } = req.body;
  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.email === email);

  if (!usuario) {
    return res.json({ success: false, message: "Correo no registrado." });
  }

  // Aquí podrías enviar un correo real
  return res.json({
    success: true,
    message: `Correo de recuperación enviado a ${email}.`,
  });
});

// ------------------------------
// SERVIDOR
// ------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});
