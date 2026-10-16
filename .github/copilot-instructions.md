CONTEXTO
Estoy construyendo la maqueta visual (mockup) de WinStock, un sistema web con PWA para controlar inventarios de alimentos e insumos de maquinaria de un fundo lechero, y registrar raciones diarias por lote de ganado. Es un prototipo universitario: solo HTML, CSS y JavaScript simple. NO hay backend ni base de datos.

TU ROL
Actúa como desarrollador front-end senior con enfoque en UX/UI móvil primero.

REGLAS OBLIGATORIAS
1. Implementa SOLO lo que describo. No inventes módulos, campos ni pantallas. Si falta información, pregúntame antes.
2. NO incluyas: compras, proveedores, órdenes de compra, alertas, notificaciones, stock mínimo, "objetivo de stock", semáforo de estado del stock, "Configuración" ni "Ayuda".
3. Todo dato mostrado es de ejemplo. Muestra una etiqueta discreta "Datos de ejemplo" en las pantallas con datos y marca los datos inventados con el comentario <!-- [SIMULADO] -->. No uses nombres de personas reales.
4. Idioma: español de Chile. Números con punto de miles (1.850 kg).
5. Tecnologías: HTML5, un solo styles.css y JavaScript vanilla. Sin frameworks, librerías ni CDN. Debe abrirse con doble clic en index.html (sin servidor): no uses fetch ni includes. El layout compartido se inyecta desde layout.js con plantillas de texto.
6. JavaScript solo para la demo: abrir y cerrar modales, agregar o quitar filas del formulario de ración, y mostrar u ocultar elementos según los parámetros de la URL. Nada de lógica de negocio real ni de guardado de datos.

MENÚ LATERAL
Resumen, Raciones, Alimentos, Insumos, Lotes, Reportes, Cuentas. El menú "Mi cuenta" solo tiene "Cerrar sesión".

ROLES (se simulan con ?rol=admin o ?rol=funcionario; por defecto admin)
- Administrador: ve todo.
- Funcionario: no ve Resumen, Raciones, Lotes, Reportes ni Cuentas. Ve solo los inventarios asignados (?inv=alimentos o ?inv=insumos; por defecto ambos). No puede editar ni deshabilitar alimentos, ni modificar insumos.

DISEÑO (mantén el estilo del prototipo anterior, adjunto)
- Barra lateral verde oscuro #173D30, ítem activo #2F5145, texto claro; logo "WinStock" con subtítulo "GESTIÓN DEL PREDIO".
- Fondo #F6F7F3, tarjetas blancas con borde fino y esquinas redondeadas, barra superior blanca con el nombre de la sección y "Mi cuenta".
- Botón primario #173D30 con texto blanco; botón secundario blanco con borde.
- Colores de estado: verde #548B5B, ámbar #C59735, rojo #C25D52, rojo claro de fondo #F8EDEC. Úsalos solo para estados de cuenta, advertencias y errores, nunca para el nivel de stock.
- Tipografía system-ui, títulos en semibold, subtítulos grises. Todo definido con variables CSS.
- Responsive móvil primero: en pantallas angostas la barra lateral pasa a menú hamburguesa o barra inferior, las tablas se convierten en tarjetas apiladas, botones de al menos 44 px de alto y formularios en una columna.
- Accesible: labels asociados a inputs, foco visible, contraste suficiente y aria-label en los modales.

ARCHIVOS
index.html es el login. Una página por pantalla en la raíz, más styles.css y layout.js. Reutiliza los mismos componentes (botones, tarjetas, tablas, formularios, modales, avisos) en todas las páginas.

PRIMERA TAREA
Crea solo styles.css, layout.js, index.html (login) y resumen.html. El resumen debe tener: título "Resumen de la gestión", botón "Registrar ración diaria", tarjetas con el stock de cada alimento (nombre y kg, SIN estado ni objetivo) y tarjetas "Alimentos" e "Insumos" con enlace "Ver inventario". Cuando termines, detente y espera mis instrucciones.