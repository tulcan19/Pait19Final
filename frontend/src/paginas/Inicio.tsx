import { useState, useEffect, useCallback } from 'react';
import {
  obtenerProductosTienda,
  obtenerCategoriasTienda,
  obtenerDestacados,
  obtenerConfiguracionTienda,
  type Producto,
  type Categoria,
  type ConfiguracionTienda,
} from '../api/tienda';
import './Inicio.css';
import { obtenerUsuario } from '../contextos/sesion';
import AgeGate from '../componentes/AgeGate';
import ChatBot from '../componentes/ChatBot';

// Helper component for Material Icons
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface InicioProps {
  onIrALogin: (modo?: "login" | "registro") => void;
  onSalir?: () => void;
}

interface CarritoItem {
  producto: Producto;
  cantidad: number;
}

export default function Inicio({ onIrALogin, onSalir }: InicioProps) {
  const usuarioLogueado = obtenerUsuario();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);

  const [config, setConfig] = useState<ConfiguracionTienda | null>(null);

  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const [productoModal, setProductoModal] = useState<Producto | null>(null);

  const [verificado, setVerificado] = useState(() => {
    return localStorage.getItem('age-verified') === 'true';
  });

  const [heroSlide, setHeroSlide] = useState(0);
  const heroSlidesFallback: SlideConfig[] = [
    { titulo: 'CRAFT BEER', subtitulo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', boton: 'SEE MORE', imagen: '/hero-bg.png' },
    { titulo: 'PREMIUM WHISKY', subtitulo: 'Descubre nuestra colección exclusiva de whiskies escoceses.', boton: 'EXPLORAR', imagen: '/hero-bg.png' },
    { titulo: 'FINE WINES', subtitulo: 'Los mejores vinos de las bodegas más prestigiosas del mundo.', boton: 'VER MÁS', imagen: '/hero-bg.png' },
  ];

  const slidesActuales = config?.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : heroSlidesFallback;

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { cargarProductos(); }, [categoriaActiva, busqueda, paginaActual]);
  useEffect(() => {
    const timer = setInterval(() => setHeroSlide((p) => (p + 1) % slidesActuales.length), 5000);
    return () => clearInterval(timer);
  }, [slidesActuales.length]);

  // Manejar verificación de edad
  const manejarVerificacion = () => {
    localStorage.setItem('age-verified', 'true');
    setVerificado(true);
  };

  // Bloquear scroll si no está verificado
  useEffect(() => {
    if (!verificado) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [verificado]);

  const cargarDatos = async () => {
    try {
      const [catRes, destRes, configRes] = await Promise.all([
        obtenerCategoriasTienda(),
        obtenerDestacados(8),
        obtenerConfiguracionTienda(),
      ]);
      setCategorias(catRes.categorias || []);
      setDestacados(destRes.productos || []);
      if (configRes.ok && configRes.configuracion) {
        setConfig(configRes.configuracion);
      }
    } catch (err) { console.error('Error cargando datos:', err); }
  };

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await obtenerProductosTienda({
        categoria: categoriaActiva || undefined,
        busqueda: busqueda || undefined,
        pagina: paginaActual,
        limite: 12,
      });
      setProductos(res.productos || []);
      setTotalPaginas(res.totalPaginas || 1);
    } catch (err) { console.error('Error cargando productos:', err); }
    finally { setCargando(false); }
  }, [categoriaActiva, busqueda, paginaActual]);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id_producto === producto.id_producto);
      if (existente) {
        return prev.map((i) => i.producto.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const eliminarDelCarrito = (id: number) => setCarrito((prev) => prev.filter((i) => i.producto.id_producto !== id));
  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito((prev) => prev.map((i) => i.producto.id_producto === id ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i).filter((i) => i.cantidad > 0));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0);
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const handleBuscar = (e: React.FormEvent) => { e.preventDefault(); setBusqueda(busquedaInput); setPaginaActual(1); };
  const handleCategoria = (id: number | null) => { setCategoriaActiva(id); setPaginaActual(1); };
  const formatPrecio = (precio: number | string) => `$${Number(precio).toFixed(2)}`;

  const scrollToContacto = () => {
    const footer = document.getElementById('contacto');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderStars = (rating = 0) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name={i <= rating ? 'star' : 'star_border'} className="star-icon" />
      ))}
    </div>
  );

  return (
    <div className="tienda-container">
      {/* Age Gate */}
      {!verificado && <AgeGate onVerify={manejarVerificacion} />}
      
      {/* ===== TOP BAR ===== */}
      <div className="topbar">
        <div className="topbar-left">
          <span><Icon name="phone" /> {config?.telefono || "0123-456-789"}</span>
          <span><Icon name="mail" /> {config?.email || "contacto@sierrastock.com"}</span>
        </div>
        <div className="topbar-right">
          {usuarioLogueado ? (
            <>
              <span>Bienvenido, <strong>{usuarioLogueado.nombre}</strong></span>
              <button onClick={onSalir} className="topbar-link" style={{ marginLeft: '10px' }}>
                <Icon name="logout" className="icon-small" /> Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <span>Bienvenido, </span>
              <button onClick={() => onIrALogin("login")} className="topbar-link">Iniciar Sesión</button>
              <span> o </span>
              <button onClick={() => onIrALogin("registro")} className="topbar-link">Crear cuenta</button>
            </>
          )}
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo" onClick={() => { handleCategoria(null); setBusqueda(''); setBusquedaInput(''); }}>
            <Icon name="shopping_bag" className="header-logo-icon" />
            <span className="header-logo-text">Sierra Stock</span>
          </div>
          <form className="header-search" onSubmit={handleBuscar}>
            <input type="text" placeholder="Buscar en catálogo" value={busquedaInput} onChange={(e) => setBusquedaInput(e.target.value)} className="header-search-input" />
            <button type="submit" className="header-search-btn"><Icon name="search" /></button>
          </form>
          <button className="header-cart" onClick={() => setCarritoVisible(!carritoVisible)}>
            <Icon name="shopping_cart" />
            <span className="header-cart-text">Carrito: {totalItems} {totalItems === 1 ? 'Producto' : 'Productos'} - {formatPrecio(totalCarrito)}</span>
          </button>
        </div>
      </header>

      {/* ===== NAVIGATION ===== */}
      <nav className="main-nav">
        <button className={`main-nav-item ${!categoriaActiva && !busqueda ? 'active' : ''}`} onClick={() => { handleCategoria(null); setBusqueda(''); setBusquedaInput(''); }}>
          <Icon name="home" />
        </button>
        {(config?.navLinks || ['NUEVOS', 'ESPECIALES', 'BEST SELLERS']).map((link, idx) => (
          <button key={idx} className="main-nav-item" onClick={() => { handleCategoria(null); setBusqueda(''); setBusquedaInput(''); }}>
            {link}
          </button>
        ))}
        {categorias.map((cat) => (
          <button key={cat.id_categoria} className={`main-nav-item ${categoriaActiva === cat.id_categoria ? 'active' : ''}`} onClick={() => handleCategoria(cat.id_categoria)}>
            {cat.nombre.toUpperCase()}
          </button>
        ))}
        <button className="main-nav-item" onClick={scrollToContacto}>CONTACTO</button>
      </nav>

      <main className="tienda-main-content">
        {/* ===== HERO SLIDER ===== */}
        {!categoriaActiva && !busqueda && (
          <section className="hero-slider">
            <div
              className="hero-slide"
              style={{
                backgroundImage: `url(${slidesActuales[heroSlide].imagen || '/hero-bg.png'})`
              }}
            >
              <div className="hero-slide-overlay">
                <div className="hero-slide-content" key={heroSlide}>
                  <h1 className="hero-title">{slidesActuales[heroSlide].titulo}</h1>
                  <div className="hero-divider" />
                  <p className="hero-subtitle">{slidesActuales[heroSlide].subtitulo}</p>
                  <button
                    className="hero-btn"
                    onClick={() => {
                      const slide = slidesActuales[heroSlide];
                      if (slide.id_categoria) {
                        handleCategoria(slide.id_categoria);
                        setTimeout(() => {
                          const prodSection = document.querySelector('.featured-cats, .products-grid');
                          prodSection?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                  >
                    {slidesActuales[heroSlide].boton}
                  </button>
                </div>
              </div>
            </div>
            <div className="hero-dots">
              {slidesActuales.map((_, i) => (
                <span key={i} className={`dot ${heroSlide === i ? 'active' : ''}`} onClick={() => setHeroSlide(i)} />
              ))}
            </div>
          </section>
        )}

        {/* ===== CATEGORY BANNERS (3 cards like reference) ===== */}
        {!categoriaActiva && !busqueda && categorias.length > 0 && (
          <section className="cat-banners">
            {categorias.slice(0, 3).map((cat, idx) => {
              const fallbackImgs = ['/cat-whisky.png', '/cat-gin.png', '/cat-tequila.png'];
              const imgSrc = cat.imagen || fallbackImgs[idx % fallbackImgs.length];
              const bannerInfo = (config?.banners || [])[idx] || { label: 'NUEVA CATEGORÍA', desc: 'LOREM IPSUM DOLOR SIT AMET' };

              return (
                <div key={cat.id_categoria} className="cat-banner" onClick={() => handleCategoria(cat.id_categoria)}>
                  <img src={imgSrc} alt={cat.nombre} className="cat-banner-img" />
                  <div className="cat-banner-overlay">
                    <span className="cat-banner-label">{bannerInfo.label}</span>
                    <h3 className="cat-banner-title">{cat.nombre.toUpperCase()}</h3>
                    <p className="cat-banner-desc">{bannerInfo.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ===== FEATURED CATEGORIES ===== */}
        {!categoriaActiva && !busqueda && categorias.length > 0 && (
          <section className="section featured-cats">
            <h2 className="section-heading">CATEGORÍAS DESTACADAS</h2>
            <div className="featured-cats-grid">
              {categorias.slice(0, 4).map((cat, idx) => {
                const fallbackImgs = ['/cat-whisky.png', '/cat-gin.png', '/cat-tequila.png', '/cat-rum.png'];
                const imgSrc = cat.imagen || fallbackImgs[idx % fallbackImgs.length];
                return (
                  <div key={cat.id_categoria} className="featured-cat-card">
                    <div className="featured-cat-img-wrap">
                      <img src={imgSrc} alt={cat.nombre} className="featured-cat-img" />
                    </div>
                    <h4 className="featured-cat-name">{cat.nombre.toUpperCase()}</h4>
                    <div style={{ minHeight: "40px" }}>
                      {cat.subcategorias && cat.subcategorias.length > 0 ? (
                        cat.subcategorias.slice(0, 2).map((sub: any) => (
                          <p key={sub.id_subcategoria} className="featured-cat-sub">{ (sub.nombre_final || sub.nombre).toUpperCase()}</p>
                        ))
                      ) : (
                        <p className="featured-cat-sub" style={{ opacity: 0.5 }}>SIN SUBCATEGORÍAS</p>
                      )}
                    </div>
                    <button className="btn-see-more" onClick={() => handleCategoria(cat.id_categoria)}>Ver más</button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== NEW PRODUCTS ===== */}
        {!categoriaActiva && !busqueda && (
          <section className="section">
            <h2 className="section-heading">NUEVOS PRODUCTOS</h2>
            <div className="products-grid cols-3">
              {destacados.slice(0, 6).map((prod) => (
                <div key={prod.id_producto} className="product-card" onClick={() => setProductoModal(prod)}>
                  <div className="product-card-img-wrap">
                    <span className="badge-new">New</span>
                    {prod.stock > 0 && prod.stock <= 5 && <span className="badge-reduced">Reduced price</span>}
                    {prod.imagen ? (
                      <img src={prod.imagen} alt={prod.nombre} className="product-card-img" />
                    ) : (
                      <div className="product-card-img-placeholder"><Icon name="liquor" /></div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <h5 className="product-card-name">{prod.nombre.toUpperCase()}</h5>
                    {renderStars(0)}
                    <p className="product-card-desc">{prod.descripcion}</p>
                    <p className="product-card-price">{formatPrecio(prod.precio)}</p>
                    <button className="btn-add-cart" onClick={(e) => { e.stopPropagation(); agregarAlCarrito(prod); }}>
                      <Icon name="shopping_cart" /> Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== FEATURED PRODUCTS (horizontal) ===== */}
        {!categoriaActiva && !busqueda && destacados.length > 0 && (
          <section className="section">
            <h2 className="section-heading">PRODUCTOS DESTACADOS</h2>
            <div className="products-grid cols-4">
              {destacados.slice(0, 4).map((prod) => (
                <div key={prod.id_producto} className="product-card" onClick={() => setProductoModal(prod)}>
                  <div className="product-card-img-wrap">
                    <span className="badge-new">New</span>
                    {prod.imagen ? (
                      <img src={prod.imagen} alt={prod.nombre} className="product-card-img" />
                    ) : (
                      <div className="product-card-img-placeholder"><Icon name="liquor" /></div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <h5 className="product-card-name">{prod.nombre.toUpperCase()}</h5>
                    {renderStars(0)}
                    <p className="product-card-desc">{prod.descripcion}</p>
                    <p className="product-card-price">{formatPrecio(prod.precio)}</p>
                    <button className="btn-add-cart" onClick={(e) => { e.stopPropagation(); agregarAlCarrito(prod); }}>
                      <Icon name="shopping_cart" /> Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== ALL PRODUCTS / FILTERED ===== */}
        <section className="section">
          <h2 className="section-heading">
            {categoriaActiva
              ? categorias.find((c) => c.id_categoria === categoriaActiva)?.nombre?.toUpperCase() || 'PRODUCTOS'
              : busqueda
                ? `RESULTADOS PARA "${busqueda.toUpperCase()}"`
                : 'TODOS LOS PRODUCTOS'}
          </h2>

          {cargando ? (
            <div className="products-grid cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-text" />
                  <div className="skeleton-text short" />
                </div>
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="empty-state">
              <Icon name="search_off" className="empty-icon" />
              <h3>No se encontraron productos</h3>
              <p>Intenta con una búsqueda diferente o explora nuestras categorías.</p>
            </div>
          ) : (
            <>
              <div className="products-grid cols-3">
                {productos.map((prod) => (
                  <div key={prod.id_producto} className="product-card" onClick={() => setProductoModal(prod)}>
                    <div className="product-card-img-wrap">
                      <span className="badge-new">New</span>
                      {prod.stock <= 0 && <span className="badge-out">Agotado</span>}
                      {prod.imagen ? (
                        <img src={prod.imagen} alt={prod.nombre} className="product-card-img" />
                      ) : (
                        <div className="product-card-img-placeholder"><Icon name="liquor" /></div>
                      )}
                    </div>
                    <div className="product-card-body">
                      <h5 className="product-card-name">{prod.nombre.toUpperCase()}</h5>
                      {renderStars(0)}
                      <p className="product-card-desc">{prod.descripcion}</p>
                      <p className="product-card-price">{formatPrecio(prod.precio)}</p>
                      <button className="btn-add-cart" onClick={(e) => { e.stopPropagation(); agregarAlCarrito(prod); }} disabled={prod.stock <= 0}>
                        <Icon name="shopping_cart" /> {prod.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPaginas > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={paginaActual === 1} onClick={() => setPaginaActual((p) => p - 1)}>← Anterior</button>
                  {[...Array(totalPaginas)].map((_, i) => (
                    <button key={i} className={`page-btn ${paginaActual === i + 1 ? 'active' : ''}`} onClick={() => setPaginaActual(i + 1)}>{i + 1}</button>
                  ))}
                  <button className="page-btn" disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual((p) => p + 1)}>Siguiente →</button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* ===== CART SIDEBAR ===== */}
      <div className={`cart-sidebar ${carritoVisible ? 'open' : ''}`}>
        <div className="cart-sidebar-header">
          <h3><Icon name="shopping_cart" /> Tu Carrito</h3>
          <button className="cart-sidebar-close" onClick={() => setCarritoVisible(false)}><Icon name="close" /></button>
        </div>
        {carrito.length === 0 ? (
          <div className="cart-sidebar-empty"><Icon name="shopping_cart" className="cart-empty-icon" /><p>Tu carrito está vacío</p></div>
        ) : (
          <>
            <div className="cart-sidebar-items">
              {carrito.map((item) => (
                <div key={item.producto.id_producto} className="cart-sidebar-item">
                  <div className="cart-sidebar-item-img">
                    {item.producto.imagen ? <img src={item.producto.imagen} alt={item.producto.nombre} /> : <Icon name="liquor" />}
                  </div>
                  <div className="cart-sidebar-item-info">
                    <h5>{item.producto.nombre}</h5>
                    <span className="cart-sidebar-item-price">{formatPrecio(item.producto.precio)}</span>
                    <div className="cart-sidebar-item-qty">
                      <button onClick={() => cambiarCantidad(item.producto.id_producto, -1)}>−</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.producto.id_producto, 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-sidebar-item-del" onClick={() => eliminarDelCarrito(item.producto.id_producto)}><Icon name="delete" /></button>
                </div>
              ))}
            </div>
            <div className="cart-sidebar-footer">
              <div className="cart-sidebar-total"><span>Total:</span><strong>{formatPrecio(totalCarrito)}</strong></div>
              <button className="cart-sidebar-checkout" onClick={() => onIrALogin("login")}>Proceder al Pago</button>
            </div>
          </>
        )}
      </div>
      {carritoVisible && <div className="overlay" onClick={() => setCarritoVisible(false)} />}

      {/* ===== PRODUCT MODAL ===== */}
      {productoModal && (
        <div className="modal-overlay" onClick={() => setProductoModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setProductoModal(null)}><Icon name="close" /></button>
            <div className="modal-grid">
              <div className="modal-img-area">
                {productoModal.imagen ? <img src={productoModal.imagen} alt={productoModal.nombre} /> : <div className="modal-placeholder"><Icon name="liquor" /></div>}
              </div>
              <div className="modal-info-area">
                <span className="modal-cat">{productoModal.categoria_nombre}</span>
                <h2 className="modal-name">{productoModal.nombre}</h2>
                {renderStars(0)}
                <p className="modal-desc">{productoModal.descripcion || 'Sin descripción disponible.'}</p>
                <div className="modal-stock-info">
                  {productoModal.stock > 0
                    ? <span className="stock-in"><Icon name="check_circle" /> En stock ({productoModal.stock} disponibles)</span>
                    : <span className="stock-out"><Icon name="cancel" /> Agotado</span>}
                </div>
                <p className="modal-price">{formatPrecio(productoModal.precio)}</p>
                <button className="btn-add-cart modal-add-btn" onClick={() => { agregarAlCarrito(productoModal); setProductoModal(null); }} disabled={productoModal.stock <= 0}>
                  <Icon name="add_shopping_cart" /> {productoModal.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="store-footer">
        <div className="footer-benefits">
          <div className="footer-benefit"><Icon name="local_shipping" className="benefit-icon" /><div><strong>ENVÍO GRATIS</strong><p>En pedidos mayores a $50</p></div></div>
          <div className="footer-benefit"><Icon name="undo" className="benefit-icon" /><div><strong>DEVOLUCIONES</strong><p>30 días para devolución</p></div></div>
          <div className="footer-benefit"><Icon name="support_agent" className="benefit-icon" /><div><strong>SOPORTE 24/7</strong><p>Atención al cliente siempre</p></div></div>
          <div className="footer-benefit"><Icon name="lock" className="benefit-icon" /><div><strong>PAGO SEGURO</strong><p>Compra segura y protegida</p></div></div>
        </div>
        <div className="footer-main">
          <div className="footer-col">
            <h4>PRODUCTOS</h4>
            <ul>
              <li><button onClick={() => handleCategoria(null)}>Nuevos</button></li>
              <li><button>Best Sellers</button></li>
              <li><button>Especiales</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>NUESTRA EMPRESA</h4>
            <ul><li>Términos y Condiciones</li><li>Sobre nosotros</li><li>Contacto</li></ul>
          </div>
          <div className="footer-col">
            <h4>TU CUENTA</h4>
            <ul><li><button onClick={() => onIrALogin("login")}>Iniciar Sesión</button></li><li><button onClick={() => setCarritoVisible(true)}>Mi Carrito</button></li></ul>
          </div>
          <div className="footer-col" id="contacto">
            <h4>CONTACTO</h4>
            <ul>
              <li><Icon name="phone" /> 0123-456-789</li>
              <li><Icon name="mail" /> contacto@sierrastock.com</li>
              <li><Icon name="location_on" /> Av. Principal #123</li>
            </ul>
          </div>
        </div>
        <div className="footer-newsletter">
          <span>NEWSLETTER</span>
          <div className="newsletter-form">
            <input type="email" placeholder="Tu email" />
            <button>SUSCRIBIR</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Sierra Stock. Todos los derechos reservados.</p>
        </div>
      </footer>
      <ChatBot />
    </div>
  );
}
