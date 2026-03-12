import { useState, useEffect } from "react";
import Login from "./paginas/Login";
import Dashboard from "./paginas/Dashboard";
import Inicio from "./paginas/Inicio";
import { Notificaciones } from "./componentes/Notificaciones";
import "./estilos/notificaciones.css";
import { esCliente } from "./contextos/sesion";

function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem("token"));
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [loginModo, setLoginModo] = useState<"login" | "registro">("login");

  useEffect(() => {
    // Verificar si el token sigue siendo válido al cargar
    const token = localStorage.getItem("token");
    if (token) {
      // El interceptor de axios manejará tokens inválidos
      setAutenticado(true);
    }
  }, []);

  const handleSalir = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAutenticado(false);
    setMostrarLogin(false); // Volver a inicio al salir
  };

  return (
    <>
      {!autenticado ? (
        mostrarLogin ? (
          <Login
            modoInicial={loginModo}
            onLoginExitoso={() => {
              setAutenticado(true);
              setMostrarLogin(false);
            }}
          />
        ) : (
          <Inicio onIrALogin={(modo: "login" | "registro" | undefined) => {
            setLoginModo(modo || "login");
            setMostrarLogin(true);
          }} />
        )
      ) : esCliente() ? (
        <Inicio
          onIrALogin={(modo) => {
            setLoginModo(modo || "login");
            setMostrarLogin(true);
            // Si ya está autenticado pero vuelve a login, forzamos salida o manejamos según flujo
          }}
          onSalir={handleSalir}
        />
      ) : (
        <Dashboard onSalir={handleSalir} />
      )}
      <Notificaciones />
    </>
  );
}

export default App;




// import { useState } from "react";
// import Login from "./paginas/Login";
// import Dashboard from "./paginas/Dashboard";

// function App() {
//   const [autenticado, setAutenticado] = useState(!!localStorage.getItem("token"));

//   if (!autenticado) return <Login />;

//   return <Dashboard onSalir={() => setAutenticado(false)} />;
// }

// export default App;

