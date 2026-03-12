import { useState } from "react";
import api from "../api/api";
import "../estilos/login.css";

// Constantes de validación
const MIN_PASSWORD_LENGTH = 6;

interface PropsLogin {
  onLoginExitoso?: () => void;
  modoInicial?: "login" | "registro";
}

const Login = (props: PropsLogin = {}) => {
  const { onLoginExitoso, modoInicial = "login" } = props;
  const [modo, setModo] = useState<"login" | "registro">(modoInicial);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error">("error");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string; contrasena?: string; fechaNacimiento?: string; terminos?: string }>({});

  // Verificación de edad y términos
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);

  // Validación del correo
  const validarCorreo = (email: string): string | null => {
    if (!email.trim()) {
      return "El correo es obligatorio";
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Formato de correo inválido";
    }

    return null;
  };

  const validarNombre = (val: string): string | null => {
    if (modo === "registro" && !val.trim()) return "El nombre es obligatorio";
    return null;
  };

  // Validación de contraseña
  const validarContrasena = (pass: string): string | null => {
    if (!pass) {
      return "La contraseña es obligatoria";
    }

    if (pass.length < MIN_PASSWORD_LENGTH) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }

    return null;
  };

  // Validar edad (18+)
  const validarEdad = (fecha: string): string | null => {
    if (modo !== "registro") return null;
    if (!fecha) return "La fecha de nacimiento es obligatoria";

    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesDiff = hoy.getMonth() - nacimiento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    if (edad < 18) return "Debes ser mayor de 18 años para registrarte";
    if (edad > 120) return "Fecha de nacimiento no válida";
    return null;
  };

  // Validar todo el formulario
  const validarFormulario = (): boolean => {
    const nuevoErrores: { nombre?: string; correo?: string; contrasena?: string; fechaNacimiento?: string; terminos?: string } = {};

    const errorNombre = validarNombre(nombre);
    if (errorNombre) nuevoErrores.nombre = errorNombre;

    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) nuevoErrores.correo = errorCorreo;

    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) nuevoErrores.contrasena = errorContrasena;

    // Validaciones solo para registro
    if (modo === "registro") {
      const errorEdad = validarEdad(fechaNacimiento);
      if (errorEdad) nuevoErrores.fechaNacimiento = errorEdad;

      if (!aceptaTerminos) {
        nuevoErrores.terminos = "Debes aceptar los términos y condiciones";
      }
    }

    setErrores(nuevoErrores);
    return Object.keys(nuevoErrores).length === 0;
  };

  // Manejar cambio de correo con validación en tiempo real
  const handleCorreoChange = (valor: string) => {
    setCorreo(valor);
    if (errores.correo) {
      const error = validarCorreo(valor);
      setErrores(prev => ({ ...prev, correo: error || undefined }));
    }
  };

  // Manejar cambio de contraseña con validación en tiempo real
  const handleContrasenaChange = (valor: string) => {
    setContrasena(valor);
    if (errores.contrasena) {
      const error = validarContrasena(valor);
      setErrores(prev => ({ ...prev, contrasena: error || undefined }));
    }
  };

  const manejarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    if (!validarFormulario()) return;

    setCargando(true);

    try {
      const url = modo === "login" ? "/autenticacion/login" : "/autenticacion/registro";
      const payload = modo === "login"
        ? { correo: correo.toLowerCase().trim(), contrasena }
        : { nombre: nombre.trim(), correo: correo.toLowerCase().trim(), contrasena };

      const respuesta = await api.post(url, payload);

      if (modo === "registro") {
        setModo("login");
        setMensaje("Registro exitoso. ¡Inicia sesión!");
        setTipoMensaje("exito");
        setNombre("");
        setFechaNacimiento("");
        setAceptaTerminos(false);
        return;
      }

      const { token, usuario } = respuesta.data;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      setMensaje(`Bienvenido ${usuario.nombre}`);
      setTipoMensaje("exito");

      if (onLoginExitoso) {
        setTimeout(() => onLoginExitoso(), 800);
      } else {
        setTimeout(() => window.location.reload(), 800);
      }

    } catch (error: any) {
      const mensajeError = error?.response?.data?.mensaje || "Error en el proceso";
      setMensaje(mensajeError);
      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-contenedor">
      <div className="login-card">
        {/* Header con logo */}
        <div className="login-header">
          <div className="login-logo">
            <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>storefront</span>
          </div>
          <h2>{modo === "login" ? "Sierra Stock" : "Crea tu Cuenta"}</h2>
          <p className="login-subtitulo">{modo === "login" ? "Sistema de Gestión Comercial" : "Únete a nuestra comunidad"}</p>
        </div>

        <form className="login-form" onSubmit={manejarFormulario}>
          {/* Campo Nombre (solo registro) */}
          {modo === "registro" && (
            <div className="login-campo">
              <label className="login-label" htmlFor="nombre">Nombre completo</label>
              <div className="login-input-wrapper">
                <input
                  id="nombre"
                  className={`login-input ${errores.nombre ? "error" : ""}`}
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={cargando}
                />
                <span className="login-input-icon material-symbols-outlined">person</span>
              </div>
              {errores.nombre && <span className="login-error-texto">{errores.nombre}</span>}
            </div>
          )}
          {/* Campo correo */}
          <div className="login-campo">
            <label className="login-label" htmlFor="correo">
              Correo electrónico
            </label>
            <div className="login-input-wrapper">
              <input
                id="correo"
                className={`login-input ${errores.correo ? "error" : ""}`}
                type="email"
                placeholder="ingrese su correo"
                value={correo}
                onChange={(e) => handleCorreoChange(e.target.value)}
                onBlur={() => {
                  const error = validarCorreo(correo);
                  setErrores(prev => ({ ...prev, correo: error || undefined }));
                }}
                disabled={cargando}
                autoComplete="email"
                autoFocus
              />
              <span className="login-input-icon material-symbols-outlined">email</span>
            </div>
            {errores.correo && (
              <span className="login-error-texto">{errores.correo}</span>
            )}
            <div className="login-dominio-info">
              {/* <span>Solo correos @sierrastock.com</span> */}
            </div>
          </div>

          {/* Campo Fecha de Nacimiento (solo registro) */}
          {modo === "registro" && (
            <div className="login-campo">
              <label className="login-label" htmlFor="fechaNacimiento">Fecha de nacimiento</label>
              <div className="login-input-wrapper">
                <input
                  id="fechaNacimiento"
                  className={`login-input ${errores.fechaNacimiento ? "error" : ""}`}
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => {
                    setFechaNacimiento(e.target.value);
                    if (errores.fechaNacimiento) {
                      const error = validarEdad(e.target.value);
                      setErrores(prev => ({ ...prev, fechaNacimiento: error || undefined }));
                    }
                  }}
                  onBlur={() => {
                    if (fechaNacimiento) {
                      const error = validarEdad(fechaNacimiento);
                      setErrores(prev => ({ ...prev, fechaNacimiento: error || undefined }));
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={cargando}
                />
                <span className="login-input-icon material-symbols-outlined">cake</span>
              </div>
              {errores.fechaNacimiento && (
                <span className="login-error-texto">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>warning</span>
                  {errores.fechaNacimiento}
                </span>
              )}
              <div className="login-dominio-info">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '2px' }}>info</span>
                  Debes ser mayor de 18 años para comprar bebidas alcohólicas
                </span>
              </div>
            </div>
          )}

          {/* Checkbox Términos y Condiciones (solo registro) */}
          {modo === "registro" && (
            <div className="login-campo">
              <div className="login-terminos-wrapper">
                <label className="login-terminos-label">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(e) => {
                      setAceptaTerminos(e.target.checked);
                      if (errores.terminos && e.target.checked) {
                        setErrores(prev => ({ ...prev, terminos: undefined }));
                      }
                    }}
                    className="login-terminos-checkbox"
                    disabled={cargando}
                  />
                  <span className="login-terminos-checkmark"></span>
                  <span className="login-terminos-texto">
                    He leído y acepto los{' '}
                    <button
                      type="button"
                      className="login-terminos-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setMostrarTerminos(true);
                      }}
                    >
                      Términos y Condiciones
                    </button>
                  </span>
                </label>
              </div>
              {errores.terminos && (
                <span className="login-error-texto">{errores.terminos}</span>
              )}
            </div>
          )}

          {/* Campo contraseña */}
          <div className="login-campo">
            <label className="login-label" htmlFor="contrasena">
              Contraseña
            </label>
            <div className="login-input-wrapper">
              <input
                id="contrasena"
                className={`login-input ${errores.contrasena ? "error" : ""}`}
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => handleContrasenaChange(e.target.value)}
                onBlur={() => {
                  const error = validarContrasena(contrasena);
                  setErrores(prev => ({ ...prev, contrasena: error || undefined }));
                }}
                disabled={cargando}
                autoComplete="current-password"
              />
              <span className="login-input-icon material-symbols-outlined">lock</span>
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                tabIndex={-1}
              >
                {mostrarContrasena ? <span className="material-symbols-outlined">visibility_off</span> : <span className="material-symbols-outlined">visibility</span>}
              </button>
            </div>
            {errores.contrasena && (
              <span className="login-error-texto">{errores.contrasena}</span>
            )}
          </div>

          {/* Botón de login */}
          <button
            className="login-boton"
            type="submit"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="login-boton-spinner"></span>
                {modo === "login" ? "Ingresando..." : "Registrando..."}
              </>
            ) : (
              modo === "login" ? "Ingresar al Sistema" : "Crear mi Cuenta"
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="btn-texto"
              onClick={() => {
                setModo(modo === "login" ? "registro" : "login");
                setMensaje("");
                setErrores({});
                setFechaNacimiento("");
                setAceptaTerminos(false);
              }}
              style={{ color: 'var(--color-primario)', fontWeight: 600, fontSize: '0.9rem' }}
            >
              {modo === "login" ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>

        {/* Mensaje de respuesta */}
        {mensaje && (
          <div className={`login-mensaje ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-texto">
            Sistema de Gestión para
          </p>
          <span className="login-footer-marca">Sierra Stock</span>
        </div>
      </div>

      {/* Modal de Términos y Condiciones */}
      {mostrarTerminos && (
        <div className="terminos-overlay" onClick={() => setMostrarTerminos(false)}>
          <div className="terminos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terminos-modal-header">
              <h3>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>gavel</span>
                Términos y Condiciones
              </h3>
              <button className="terminos-modal-close" onClick={() => setMostrarTerminos(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="terminos-modal-body">
              <h4>1. Aceptación de Términos</h4>
              <p>Al registrarte y utilizar los servicios de <strong>Sierra Stock</strong>, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de estos términos, no debes registrarte ni utilizar nuestros servicios.</p>

              <h4>2. Requisito de Edad</h4>
              <p>Para registrarte en Sierra Stock y adquirir productos, debes ser <strong>mayor de 18 años</strong>. La venta de bebidas alcohólicas a menores de edad está prohibida por la ley ecuatoriana (Ley Orgánica de Salud, Art. 46). Sierra Stock se reserva el derecho de solicitar identificación oficial para verificar la edad del comprador en cualquier momento.</p>

              <h4>3. Uso Responsable</h4>
              <p>Al adquirir bebidas alcohólicas a través de Sierra Stock, te comprometes a:</p>
              <ul>
                <li>Consumir los productos de manera responsable.</li>
                <li>No revender los productos adquiridos a menores de edad.</li>
                <li>No conducir vehículos bajo los efectos del alcohol.</li>
                <li>No proporcionar tus credenciales de acceso a menores de edad.</li>
              </ul>

              <h4>4. Cuenta de Usuario</h4>
              <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Toda actividad realizada desde tu cuenta es tu responsabilidad. Debes notificarnos inmediatamente si sospechas de uso no autorizado de tu cuenta.</p>

              <h4>5. Privacidad y Datos Personales</h4>
              <p>Los datos proporcionados durante el registro (nombre, correo electrónico, fecha de nacimiento) serán utilizados exclusivamente para la gestión de tu cuenta y la prestación de nuestros servicios. No compartiremos tu información personal con terceros sin tu consentimiento, salvo cuando sea requerido por ley.</p>

              <h4>6. Precios y Disponibilidad</h4>
              <p>Los precios mostrados en la plataforma son en dólares americanos (USD) e incluyen los impuestos aplicables. Sierra Stock se reserva el derecho de modificar los precios y la disponibilidad de productos sin previo aviso.</p>

              <h4>7. Política de Devoluciones</h4>
              <p>Las devoluciones se aceptan dentro de los 30 días posteriores a la compra, siempre que el producto se encuentre sin abrir y en su empaque original. Las bebidas alcohólicas abiertas no son elegibles para devolución, excepto en casos de defecto del producto.</p>

              <h4>8. Limitación de Responsabilidad</h4>
              <p>Sierra Stock no se hace responsable por el uso inadecuado de los productos adquiridos. El consumo excesivo de alcohol es perjudicial para la salud.</p>

              <h4>9. Modificaciones</h4>
              <p>Sierra Stock se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios serán efectivos a partir de su publicación en la plataforma. El uso continuado del servicio después de dichos cambios constituye tu aceptación de los nuevos términos.</p>

              <h4>10. Legislación Aplicable</h4>
              <p>Estos términos y condiciones se rigen por las leyes de la República del Ecuador. Cualquier disputa se resolverá en los tribunales competentes de la ciudad de Quito.</p>

              <div className="terminos-advertencia">
                <span className="material-symbols-outlined">warning</span>
                <p><strong>ADVERTENCIA:</strong> El consumo excesivo de alcohol es perjudicial para la salud. Venta prohibida a menores de 18 años. Si bebe, no conduzca.</p>
              </div>
            </div>
            <div className="terminos-modal-footer">
              <button
                className="login-boton"
                onClick={() => {
                  setAceptaTerminos(true);
                  setMostrarTerminos(false);
                  if (errores.terminos) {
                    setErrores(prev => ({ ...prev, terminos: undefined }));
                  }
                }}
              >
                Acepto los Términos y Condiciones
              </button>
              <button
                className="btn-texto"
                onClick={() => setMostrarTerminos(false)}
                style={{ marginTop: '8px', color: 'var(--color-texto-muted)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
