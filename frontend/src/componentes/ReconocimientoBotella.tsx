import React, { useState, useRef, useCallback } from 'react';
import api from '../api/api';
import { obtenerToken } from '../api/autenticacion';
import { convertirImagenABase64 } from '../helpers/imagenHelper';

type Producto = {
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio: string;
    stock: number;
    imagen?: string | null;
    categoria?: string;
};

type DatosIA = {
    marca: string | null;
    tipo_licor: string | null;
    volumen_ml: string | null;
    descripcion_visual: string | null;
};

type Props = {
    onCerrar: () => void;
    onSeleccionarProducto: (id_producto: number) => void;
    onCrearNuevo?: (datosReconocidos: DatosIA) => void;
};

const ReconocimientoBotella: React.FC<Props> = ({ onCerrar, onSeleccionarProducto, onCrearNuevo }) => {
    const [procesando, setProcesando] = useState(false);
    const [errorTexto, setErrorTexto] = useState("");
    const [resultado, setResultado] = useState<{ ia: DatosIA, sugerencias: Producto[] } | null>(null);
    const [modoCamara, setModoCamara] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const detenerCamara = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const iniciarCamara = async () => {
        setErrorTexto("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setModoCamara(true);
        } catch (err) {
            setErrorTexto("No se pudo acceder a la cámara. Verifica los permisos.");
            console.error(err);
        }
    };

    const capturarFoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL("image/jpeg", 0.8);
            detenerCamara();
            setModoCamara(false);
            enviarImagen(base64);
        }
    };

    const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setErrorTexto("");
            try {
                const base64 = await convertirImagenABase64(file);
                if (typeof base64 === 'string') {
                    enviarImagen(base64);
                }
            } catch (err: any) {
                setErrorTexto(`Error al procesar la imagen: ${err.message}`);
            }
        }
    };

    const enviarImagen = async (base64: string) => {
        setProcesando(true);
        setErrorTexto("");
        setResultado(null);
        try {
            const resp = await api.post("/reconocimiento/identificar", { imagen: base64 }, {
                headers: { Authorization: `Bearer ${obtenerToken()}` }
            });

            setResultado({
                ia: resp.data.reconocimiento,
                sugerencias: resp.data.sugerencias
            });
        } catch (error: any) {
            const mensajeError = error.response?.data?.error?.mensaje || error.response?.data?.mensaje || "Error al conectar con la IA de reconocimiento.";
            setErrorTexto(mensajeError);
        } finally {
            setProcesando(false);
        }
    };

    const cerrarModal = () => {
        detenerCamara();
        onCerrar();
    };

    return (
        <div className="modal-fondo" onClick={cerrarModal}>
            <div
                className="modal"
                style={{ maxWidth: 600, width: '90%' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ margin: 0 }}>📸 Reconocimiento de Botella</h3>
                    <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-texto-muted)' }}>✕</button>
                </div>

                {!procesando && !resultado && !modoCamara && (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                        <p style={{ color: "var(--color-texto-muted)", marginBottom: 20 }}>
                            Toma una foto o sube una imagen de la botella para identificarla automáticamente y buscarla en el inventario.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button className="btn-primario" onClick={iniciarCamara}>
                                📷 Usar Cámara
                            </button>
                            <label className="btn-secundario" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                📁 Subir Imagen
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleSubirArchivo} />
                            </label>
                        </div>
                        {errorTexto && <p style={{ color: "var(--color-error)", marginTop: 15 }}>{errorTexto}</p>}
                    </div>
                )}

                {modoCamara && (
                    <div style={{ textAlign: "center" }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radio-md)', backgroundColor: '#000' }}
                        />
                        <div style={{ marginTop: 15, display: "flex", gap: 10, justifyContent: "center" }}>
                            <button className="btn-primario" onClick={capturarFoto}>📸 Capturar</button>
                            <button className="btn-secundario" onClick={() => { detenerCamara(); setModoCamara(false); }}>Cancelar</button>
                        </div>
                    </div>
                )}

                {procesando && (
                    <div className="loading" style={{ height: "200px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>🤖🔍</div>
                        <p style={{ marginTop: "1rem" }}>Analizando la botella con Inteligencia Artificial...</p>
                        <style>
                            {`
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.7; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}
                        </style>
                    </div>
                )}

                {resultado && !procesando && (
                    <div>
                        <div style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: "var(--espaciado-md)",
                            borderRadius: "var(--radio-sm)",
                            marginBottom: "var(--espaciado-lg)",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                            <h4 style={{ margin: "0 0 10px 0", color: "var(--color-primario)" }}>IA: Botella Detectada</h4>
                            <ul style={{ margin: 0, paddingLeft: 20, color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
                                <li><b>Marca:</b> {resultado.ia.marca || 'Desconocida'}</li>
                                <li><b>Tipo:</b> {resultado.ia.tipo_licor || 'Desconocido'}</li>
                                <li><b>Volumen:</b> {resultado.ia.volumen_ml ? `${resultado.ia.volumen_ml} ml` : 'No visible'}</li>
                            </ul>
                            <p style={{ marginTop: 10, fontSize: "var(--texto-xs)", fontStyle: "italic", opacity: 0.7 }}>
                                "{resultado.ia.descripcion_visual}"
                            </p>
                        </div>

                        <h4 style={{ marginBottom: "10px" }}>Sugerencias del Inventario ({resultado.sugerencias.length})</h4>

                        {resultado.sugerencias.length > 0 ? (
                            <div style={{ display: 'grid', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                {resultado.sugerencias.map(prod => (
                                    <div key={prod.id_producto} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px',
                                        background: 'var(--color-fondo-card)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 'var(--radio-md)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {prod.imagen ? (
                                                <img src={prod.imagen} alt={prod.nombre} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                            ) : (
                                                <div style={{ width: 40, height: 40, background: '#333', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍾</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{prod.nombre}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-texto-muted)' }}>
                                                    Stock: <span style={{ color: prod.stock > 0 ? 'var(--color-exito)' : 'var(--color-error)' }}>{prod.stock}</span> | ${Number(prod.precio).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="btn-primario"
                                            onClick={() => {
                                                onSeleccionarProducto(prod.id_producto);
                                                cerrarModal();
                                            }}
                                            disabled={prod.stock <= 0 && !onCrearNuevo}
                                        >
                                            Seleccionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "var(--color-advertencia)", fontSize: "var(--texto-sm)" }}>
                                No se encontraron productos similares en el inventario.
                            </p>
                        )}

                        {onCrearNuevo && (
                            <div style={{ marginTop: "20px", textAlign: "center" }}>
                                <p style={{ fontSize: "var(--texto-sm)", marginBottom: "10px" }}>¿No encuentras el producto exacto?</p>
                                <button
                                    className="btn-secundario"
                                    style={{ width: "100%" }}
                                    onClick={() => {
                                        onCrearNuevo(resultado.ia);
                                        cerrarModal();
                                    }}
                                >
                                    ⚡ Crear nuevo usando datos de la foto
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReconocimientoBotella;
