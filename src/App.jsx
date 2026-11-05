import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

function App() {
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [pasoCheckout, setPasoCheckout] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState(null);

  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    tipoEntrega: 'domicilio',
    metodoPago: 'efectivo',
    observaciones: ''
  });

  const [esPedidoNegocio, setEsPedidoNegocio] = useState(false);

  // CATEGORÍAS FIJAS
  const categorias = [
    { id: 1, nombre: 'Raviolones', imagen: '/raviolones.jpg' },
    { id: 2, nombre: 'Sorrentinos', imagen: '/sorrentinos.jpg' },
    { id: 3, nombre: 'Canelones', imagen: '/canelones.jpg' },
    { id: 4, nombre: 'Ñoquis', imagen: '/noquisp.jpg' },
  ];

  // PRODUCTOS FIJOS (SIMULANDO BASE DE DATOS)
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Raviolones de verdura', unidad: 'Por docena', precio: 6000, stock: 15, imagen: '/raviolones.jpg' },
    { id: 2, nombre: 'Raviolones de ricota', unidad: 'Por docena', precio: 6000, stock: 12, imagen: '/raviolones.jpg' },
    { id: 3, nombre: 'Raviolones de salmón', unidad: 'Por docena', precio: 10000, stock: 8, imagen: '/raviolones.jpg' },
    { id: 4, nombre: 'Canelones de verdura', unidad: 'Bandeja 1,2 kg', precio: 13000, stock: 10, imagen: '/canelones.jpg' },
    { id: 5, nombre: 'Ñoquis de calabaza', unidad: 'Por kilo', precio: 8000, stock: 3, imagen: '/noquisc.jpg' },
    { id: 6, nombre: 'Ñoquis de espinaca', unidad: 'Por kilo', precio: 8000, stock: 10, imagen: '/noquise.jpg' },
    { id: 7, nombre: 'Ñoquis de papa', unidad: 'Por kilo', precio: 8000, stock: 14, imagen: '/noquisp.jpg' },
    { id: 8, nombre: 'Tallarines al huevo', unidad: 'Por kilo', precio: 8000, stock: 20, imagen: '/tallarines.jpg' },
    { id: 9, nombre: 'Sorrentinos jamón y queso', unidad: 'Por docena', precio: 6000, stock: 6, imagen: '/sorrentinos.jpg' },
  ]);

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      alert("Lo sentimos, este producto no tiene stock disponible.");
      return;
    }
    
    const cantidadInicial = producto.unidad.toLowerCase().includes('kilo') ? 0.5 : 1;

    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        if (existe.cantidad + cantidadInicial > producto.stock) {
          alert("Has alcanzado el límite de stock disponible para este producto.");
          return prev;
        }
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: existe.cantidad + cantidadInicial } : item);
      }
      return [...prev, { ...producto, cantidad: cantidadInicial }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id) {
        const prod = productos.find(p => p.id === id);
        const paso = prod.unidad.toLowerCase().includes('kilo') ? 0.5 : 1;
        const nuevaCantidad = item.cantidad + (delta * paso);

        if (nuevaCantidad > prod.stock) {
          alert("Supera el stock disponible.");
          return item;
        }
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean));
  };
  
  const eliminarDelCarrito = (id) => setCarrito(prev => prev.filter(item => item.id !== id));

  // CÁLCULOS CON DESCUENTO
  const cantidadTotalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const descuentoNegocio = esPedidoNegocio ? (subtotal * 0.20) : 0;
  const costoEnvio = datosCliente.tipoEntrega === 'domicilio' ? 2000 : 0;
  const totalGeneral = subtotal - descuentoNegocio + (subtotal > 0 ? costoEnvio : 0);

  const manejarEnvioPedido = (e) => {
    e.preventDefault();

    for (const item of carrito) {
      const p = productos.find(prod => prod.id === item.id);
      if (!p || p.stock < item.cantidad) {
        alert(`Stock insuficiente para ${item.nombre}. Disponible: ${p?.stock || 0}`);
        return;
      }
    }

    // Descontar inventario DE MENTIRA (solo en la memoria de esta sesión)
    setProductos(prevProductos => prevProductos.map(p => {
      const itemEnCarrito = carrito.find(c => c.id === p.id);
      if (itemEnCarrito) {
        return { ...p, stock: p.stock - itemEnCarrito.cantidad };
      }
      return p;
    }));

    const nuevoPedido = {
      id: Math.floor(1000 + Math.random() * 9000),
      fecha: new Date().toLocaleDateString('es-AR'),
      cliente: { ...datosCliente },
      items: [...carrito],
      esPedidoNegocio,
      subtotal,
      descuentoNegocio,
      costoEnvio,
      total: totalGeneral,
      estado: 'Pendiente'
    };

    setUltimoPedido(nuevoPedido);
    setCarrito([]);
    setPasoCheckout(false);
    setPedidoConfirmado(true);
    setEsPedidoNegocio(false);
  };

  const generarPDF = () => {
    if (!ultimoPedido) return;
    try {
      const doc = new jsPDF();
      doc.setFillColor(36, 61, 50);
      doc.rect(0, 0, 210, 28, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("Entre Pastas y Recuerdos", 105, 13, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(198, 166, 107);
      doc.text("PASTAS ARTESANALES", 105, 21, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(36, 61, 50);
      doc.text(`Comprobante de Pedido #${ultimoPedido.id}`, 20, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Fecha: ${ultimoPedido.fecha}`, 20, 49);
      doc.text(`Cliente: ${ultimoPedido.cliente.nombre}`, 20, 56);
      doc.text(`Teléfono: ${ultimoPedido.cliente.telefono}`, 20, 63);
      doc.text(`Modalidad: ${ultimoPedido.cliente.tipoEntrega === 'domicilio' ? 'Envío a domicilio' : 'Retiro en local'}`, 20, 70);
      doc.text(`Pago: ${ultimoPedido.cliente.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia Bancaria'}`, 20, 77);
      
      let yNext = 84;
      if (ultimoPedido.cliente.tipoEntrega === 'domicilio') {
        doc.text(`Dirección: ${ultimoPedido.cliente.direccion}`, 20, yNext);
        yNext += 7;
      }

      let y = yNext + 5;
      doc.setFillColor(36, 61, 50);
      doc.rect(20, y - 5, 170, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Producto", 24, y);
      doc.text("Cant.", 135, y, { align: "center" });
      doc.text("Subtotal", 185, y, { align: "right" });

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      ultimoPedido.items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(246, 241, 232);
          doc.rect(20, y - 4, 170, 7, "F");
        }
        doc.text(item.nombre, 24, y);
        doc.text(item.cantidad.toString(), 135, y, { align: "center" });
        doc.text(`$${(item.precio * item.cantidad).toLocaleString('es-AR')}`, 185, y, { align: "right" });
        y += 8;
      });

      y += 4;
      doc.setLineWidth(0.3);
      doc.line(110, y, 190, y);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Subtotal:", 145, y, { align: "right" });
      doc.text(`$${ultimoPedido.subtotal.toLocaleString('es-AR')}`, 185, y, { align: "right" });

      if (ultimoPedido.descuentoNegocio > 0) {
        y += 6;
        doc.setTextColor(36, 61, 50);
        doc.text("Desc. Negocio (20%):", 145, y, { align: "right" });
        doc.text(`-$${ultimoPedido.descuentoNegocio.toLocaleString('es-AR')}`, 185, y, { align: "right" });
        doc.setTextColor(80, 80, 80);
      }

      y += 6;
      doc.text("Envío:", 145, y, { align: "right" });
      doc.text(`$${ultimoPedido.costoEnvio.toLocaleString('es-AR')}`, 185, y, { align: "right" });

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(36, 61, 50);
      doc.text("Total:", 145, y, { align: "right" });
      doc.text(`$${ultimoPedido.total.toLocaleString('es-AR')}`, 185, y, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(183, 121, 90);
      doc.text("¡Gracias por tu pedido!", 105, 270, { align: "center" });

      doc.save(`Pedido_${ultimoPedido.id}_EntrePastas.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-marfil-calido relative">
      
      <header className="bg-negro-suave text-blanco sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex flex-col items-center justify-center text-blanco leading-none py-1 scale-90 md:scale-100 transform origin-left">
            <div className="flex items-center gap-2 text-dorado-suave">
              <span className="text-xs">\\</span>
              <span style={{ fontFamily: "'Dancing Script', cursive" }} className="text-2xl text-blanco mt-1">Entre</span>
              <span className="text-xs">//</span>
            </div>
            <div className="flex items-center gap-3 -mt-2">
              <span className="text-dorado-suave text-sm">♡</span>
              <span style={{ fontFamily: "'Dancing Script', cursive" }} className="text-4xl font-bold text-blanco tracking-wide">pastas</span>
              <span className="text-dorado-suave text-sm">♡</span>
            </div>
            <div className="flex items-center gap-2 -mt-1">
              <div className="w-5 h-[1px] bg-dorado-suave/60"></div>
              <span style={{ fontFamily: "'Dancing Script', cursive" }} className="text-[1.35rem] text-blanco">y recuerdos</span>
              <div className="w-5 h-[1px] bg-dorado-suave/60"></div>
            </div>
            <div className="mt-1.5 border-y border-dashed border-dorado-suave/60 px-4 py-0.5 flex items-center gap-2">
              <span className="text-[7px] text-dorado-suave">♥</span>
              <span className="font-sans text-[9px] font-bold tracking-[0.25em] text-dorado-suave mt-px">PASTAS ARTESANALES</span>
              <span className="text-[7px] text-dorado-suave">♥</span>
            </div>
          </div>

          <nav className="hidden md:flex gap-10">
            <a href="#" className="text-blanco border-b-2 border-dorado-suave pb-1">Inicio</a>
            <a href="#catalogo" className="text-blanco/80 hover:text-blanco transition-colors">Catálogo</a>
            <a href="#nosotros" className="text-blanco/80 hover:text-blanco transition-colors">Nosotros</a>
            <a href="#contacto" className="text-blanco/80 hover:text-blanco transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-6">
            {!pedidoConfirmado && (
              <button onClick={() => setMostrarCarrito(true)} className="relative text-blanco hover:text-dorado-suave transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {cantidadTotalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-dorado-suave text-negro-suave text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cantidadTotalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {pedidoConfirmado ? (
        <section className="bg-negro-suave text-blanco min-h-[85vh] flex flex-col items-center justify-center px-6 py-12 text-center relative overflow-hidden">
          <div className="max-w-md w-full space-y-6 z-10">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dorado-suave flex items-center justify-center text-dorado-suave text-2xl">✓</div>
            </div>

            <h2 className="font-serif text-4xl text-blanco">¡Gracias por tu pedido!</h2>
            <p className="text-blanco/80 text-sm">Tu pedido <strong className="text-dorado-suave">Nº {ultimoPedido?.id}</strong> fue registrado con éxito en el sistema.</p>

            {ultimoPedido?.cliente.metodoPago === 'transferencia' ? (
              <div className="bg-white/5 border border-dorado-suave/40 rounded-xl p-4 text-xs text-blanco/90 text-left space-y-2">
                <p className="font-bold text-dorado-suave text-sm">Datos para Transferencia alias:</p>
                <p>Alias: <span className="font-mono text-dorado-suave">entre.pastas.recuerdos</span></p>
                <a 
                  href={`https://wa.me/5492314570636?text=Hola,%20les%20envío%20el%20comprobante%20de%20transferencia%20del%20pedido%20%23${ultimoPedido?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full bg-[#25D366] text-white text-center py-2.5 rounded font-semibold hover:bg-[#20ba5a] transition-colors"
                >
                  Enviar comprobante por WhatsApp 💬
                </a>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-blanco/90 flex items-center gap-3 text-left">
                <span className="text-2xl text-dorado-suave">💵</span>
                <p>Abonás en efectivo al recibir tu pedido en domicilio o al retirarlo por el local.</p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <button onClick={generarPDF} className="w-full bg-dorado-suave text-negro-suave py-3 rounded font-semibold hover:bg-[#b3945c] transition-colors shadow-lg">Descargar Comprobante PDF 📄</button>
              <button onClick={() => { setPedidoConfirmado(false); setUltimoPedido(null); }} className="w-full bg-transparent border border-blanco/30 text-blanco py-3 rounded font-medium hover:bg-white/10 transition-colors">Volver al inicio</button>
            </div>
            <p className="font-serif italic text-xs text-dorado-suave pt-6">Gracias por ser parte de esta historia. ♥</p>
          </div>
        </section>
      ) : !pasoCheckout ? (
        <>
          <section className="relative w-full h-[500px] bg-negro-suave flex items-center">
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/hero.jpg')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-negro-suave/90 via-negro-suave/50 to-transparent"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
              <div className="max-w-xl">
                <h1 className="font-serif text-5xl md:text-6xl text-blanco leading-[1.1] mb-6">Pastas artesanales<br />con el sabor de siempre</h1>
                <p className="text-blanco/90 text-lg mb-8 leading-relaxed">Recetas caseras, ingredientes de calidad<br />y todo el amor en cada bocado.</p>
                <a href="#catalogo" className="bg-dorado-suave text-negro-suave px-8 py-3 rounded text-sm font-semibold hover:bg-[#b3945c] transition-colors inline-flex items-center gap-2">Ver catálogo <span>→</span></a>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-8 py-16">
            <h2 className="font-serif text-3xl text-negro-suave mb-8">Nuestras categorías</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categorias.map((cat) => (
                <div key={cat.id} className="bg-blanco rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                    <img src={cat.imagen} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <h3 className="font-medium text-negro-suave text-sm">{cat.nombre}</h3>
                    <span className="text-gris-carbon text-lg group-hover:translate-x-1 transition-transform">›</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="catalogo" className="max-w-7xl mx-auto px-8 py-8 mb-16">
            <h2 className="font-serif text-4xl text-negro-suave mb-2">Catálogo</h2>
            <p className="text-gris-carbon mb-6">Descubrí todas nuestras pastas artesanales.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productos.map((prod) => (
                <div key={prod.id} className="bg-blanco p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-gray-100">
                    <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col">
                    <h3 className="font-serif text-lg text-negro-suave leading-tight mb-1">{prod.nombre}</h3>
                    <p className="text-xs text-gray-500 mb-4">{prod.unidad}</p>
                    <div className="mt-auto">
                      <span className="block text-xl font-semibold text-negro-suave mb-3">${prod.precio.toLocaleString('es-AR')}</span>
                      {prod.stock > 0 ? (
                        <button onClick={() => agregarAlCarrito(prod)} className="w-full bg-verde-profundo text-blanco py-2.5 rounded text-sm font-medium hover:bg-[#1a2c24] transition-colors">Agregar al carrito</button>
                      ) : (
                        <button disabled className="w-full bg-gray-200 text-gray-500 py-2.5 rounded text-sm font-medium cursor-not-allowed">Sin stock</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="max-w-7xl mx-auto px-8 py-12">
          <button onClick={() => setPasoCheckout(false)} className="text-verde-profundo font-medium mb-6 hover:underline">← Volver al catálogo</button>
          <h2 className="font-serif text-3xl text-negro-suave mb-8">Finalizar tu compra</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blanco p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-serif text-xl text-negro-suave mb-4">Productos en tu pedido</h3>
                {carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-none">
                    <div>
                      <h4 className="font-medium text-sm text-negro-suave">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">${item.precio} x {item.cantidad}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button onClick={() => cambiarCantidad(item.id, -1)} className="px-2 py-0.5 text-sm hover:bg-gray-100">-</button>
                        <span className="px-2 text-sm font-medium">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item.id, 1)} className="px-2 py-0.5 text-sm hover:bg-gray-100">+</button>
                      </div>
                      <span className="font-semibold text-sm w-16 text-right">${item.precio * item.cantidad}</span>
                      <button onClick={() => eliminarDelCarrito(item.id)} className="text-terracota text-sm">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={manejarEnvioPedido} className="bg-blanco p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-serif text-xl text-negro-suave mb-2">Completa tus datos</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre y apellido *</label>
                  <input type="text" required placeholder="Tu nombre completo" value={datosCliente.nombre} onChange={(e) => setDatosCliente({...datosCliente, nombre: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-verde-profundo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono *</label>
                  <input type="tel" required placeholder="Ej: 2314570636" value={datosCliente.telefono} onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-verde-profundo" />
                </div>
                
                <label className="flex items-center gap-2 mt-2 p-3 border border-verde-profundo/30 bg-verde-profundo/5 rounded cursor-pointer hover:bg-verde-profundo/10 transition-colors">
                  <input type="checkbox" checked={esPedidoNegocio} onChange={(e) => setEsPedidoNegocio(e.target.checked)} className="w-4 h-4 text-verde-profundo rounded focus:ring-verde-profundo" />
                  <span className="text-sm font-bold text-negro-suave">Pedido para comercio / revendedor (20% OFF)</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 mt-2">Modalidad de entrega</label>
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="tipoEntrega" checked={datosCliente.tipoEntrega === 'domicilio'} onChange={() => setDatosCliente({...datosCliente, tipoEntrega: 'domicilio'})} />
                      <span className="text-sm">Envío a domicilio (En Bolívar y alrededores) +$2.000</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="tipoEntrega" checked={datosCliente.tipoEntrega === 'local'} onChange={() => setDatosCliente({...datosCliente, tipoEntrega: 'local'})} />
                      <span className="text-sm">Retiro en local (Gratis)</span>
                    </label>
                  </div>
                </div>
                {datosCliente.tipoEntrega === 'domicilio' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección de entrega *</label>
                    <input type="text" required placeholder="Calle, número, piso, departamento" value={datosCliente.direccion} onChange={(e) => setDatosCliente({...datosCliente, direccion: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-verde-profundo" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Método de pago</label>
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="metodoPago" checked={datosCliente.metodoPago === 'efectivo'} onChange={() => setDatosCliente({...datosCliente, metodoPago: 'efectivo'})} />
                      <span className="text-sm">Efectivo (contra entrega / retiro)</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="metodoPago" checked={datosCliente.metodoPago === 'transferencia'} onChange={() => setDatosCliente({...datosCliente, metodoPago: 'transferencia'})} />
                      <span className="text-sm">Transferencia Bancaria</span>
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-verde-profundo text-blanco py-3 rounded font-medium hover:bg-[#1a2c24] transition-colors mt-4">Confirmar pedido</button>
              </form>
            </div>

            <div>
              <div className="bg-blanco p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24 space-y-4">
                <h3 className="font-serif text-xl text-negro-suave border-b border-gray-200 pb-3">Resumen del pedido</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {esPedidoNegocio && (
                  <div className="flex justify-between text-sm text-verde-profundo font-bold">
                    <span>Desc. Negocio (20%)</span>
                    <span>-${descuentoNegocio.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío ({datosCliente.tipoEntrega === 'domicilio' ? 'Bolívar' : 'Retiro'})</span>
                  <span>{costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toLocaleString('es-AR')}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-bold text-negro-suave">
                  <span>Total</span>
                  <span>${totalGeneral.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CARRITO */}
      {mostrarCarrito && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-marfil-calido h-full shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-4">
              <h3 className="font-serif text-2xl text-negro-suave">Tu pedido</h3>
              <button onClick={() => setMostrarCarrito(false)} className="text-gray-500 hover:text-negro-suave font-bold text-xl">✕</button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
              {carrito.length === 0 ? <p className="text-center text-gray-500 mt-10">Tu carrito está vacío.</p> : (
                carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-blanco p-3 rounded-lg shadow-sm">
                    <div>
                      <h4 className="font-medium text-sm text-negro-suave">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">${item.precio} x {item.cantidad}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">${item.precio * item.cantidad}</span>
                      <button onClick={() => eliminarDelCarrito(item.id)} className="text-terracota text-sm">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-300 pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold text-negro-suave mb-4">
                <span>Total estimado:</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <button disabled={carrito.length === 0} onClick={() => { setMostrarCarrito(false); setPasoCheckout(true); }} className="w-full bg-dorado-suave text-negro-suave py-3 rounded font-semibold hover:bg-[#b3945c] transition-colors disabled:opacity-50">Continuar con la compra</button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FLOTANTE */}
      <a 
        href="https://wa.me/5492314570636" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
        title="Contactanos por WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
      </a>

      {/* FOOTER */}
      <footer className="bg-negro-suave text-blanco border-t border-blanco/10">
        <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-blanco/10">
          <div className="flex items-center justify-center gap-4 pt-4 md:pt-0">
            <span className="text-3xl text-dorado-suave">🌿</span>
            <div>
              <h4 className="font-medium text-sm mb-1">Ingredientes de calidad</h4>
              <p className="text-xs text-blanco/60">Seleccionamos lo mejor.</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 pt-6 md:pt-0">
            <span className="text-3xl text-dorado-suave">🛵</span>
            <div>
              <h4 className="font-medium text-sm mb-1">Envíos a domicilio</h4>
              <p className="text-xs text-blanco/60">En Bolívar y alrededores.</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 pt-6 md:pt-0">
            <span className="text-3xl text-dorado-suave">💬</span>
            <div>
              <h4 className="font-medium text-sm mb-1">Pedidos por WhatsApp</h4>
              <p className="text-xs text-blanco/60">Rápido y fácil.</p>
            </div>
          </div>
        </div>
        <div className="bg-[#121513] py-3 text-center text-xs text-blanco/40 border-t border-white/5">
          <p>Entre Pastas y Recuerdos © 2026</p>
        </div>
      </footer>

    </div>
  );
}

export default App;