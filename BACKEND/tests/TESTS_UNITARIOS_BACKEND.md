# Tests Unitarios — Backend (Alquitra)

Este documento resume todo lo que se agregó/modificó para tener tests unitarios en el backend, y explica cómo correrlos en cualquier computadora (por ejemplo, si un compañero clona el repo desde cero).

---

## 1. Cómo usar los tests en otra computadora

Parados en la carpeta `BACKEND/`, ejecutar en orden:

```bash
cd BACKEND
npm install
npm test
```

- `npm install` — instala todas las dependencias del `package.json`, incluidas las de testing (`jest`, `ts-jest`, `@types/jest`) que ya quedaron declaradas en el proyecto. No hace falta instalar nada manualmente aparte.
- `npm test` — corre `jest` (así quedó definido el script `"test": "jest"` en `package.json`) y ejecuta automáticamente todos los archivos que matcheen `**/*.test.ts` dentro de `tests/`.

Comandos extra que pueden ser útiles:

```bash
# Correr solo los tests de un controller puntual
npx jest tests/unit/ReservaController

# Correr un archivo puntual
npx jest tests/unit/ReservaController/postReserva.test.ts

# Modo watch (re-corre los tests al guardar cambios)
npx jest --watch

# Ver el detalle de cada test (no solo el resumen por archivo)
npx jest --verbose
```

No se necesita levantar la base de datos (PostgreSQL/Mongo) ni el `.env` para correr estos tests: son **tests unitarios puros**, todo lo que toca la base de datos está mockeado (ver sección 4).

---

## 2. Qué se agregó al proyecto

### Dependencias nuevas (`BACKEND/package.json`)

Se agregaron como `devDependencies`:

| Paquete | Para qué |
|---|---|
| `jest` | Framework de testing |
| `ts-jest` | Permite que Jest entienda TypeScript directamente (sin compilar a mano) |
| `@types/jest` | Tipado de las funciones globales de Jest (`describe`, `test`, `expect`, etc.) |

También se cambió el script de test, que antes era un placeholder:

```diff
- "test": "echo \"Error: no test specified\" && exit 1",
+ "test": "jest",
```

### Archivos de configuración nuevos

- **`BACKEND/jest.config.js`** — configuración de Jest: usa el preset de `ts-jest`, busca los tests dentro de `tests/`, y matchea cualquier archivo `*.test.ts`.
- **`BACKEND/tsconfig.test.json`** — configuración de TypeScript específica para los tests (extiende el `tsconfig.json` normal y le agrega los tipos de `jest`/`node`).
- **`BACKEND/tests/tsconfig.json`** — configuración auxiliar de TS para la carpeta de tests.

### Carpeta de tests (`BACKEND/tests/unit/`)

Se crearon 24 archivos de test, organizados **un archivo por función/handler**, agrupados por controller:

```
tests/unit/
├── AuthoControllers/
│   ├── Login.test.ts
│   └── registrarUsuario.test.ts
├── ClienteController/
│   ├── deleteCliente.test.ts
│   ├── getClienteById.test.ts
│   ├── getClientes.test.ts
│   ├── patchCliente.test.ts
│   ├── postCliente.test.ts
│   └── putCliente.test.ts
├── DashboardController/
│   └── getDashboardStats.test.ts
├── ReservaController/
│   ├── ValidarEstadoEnum.test.ts
│   ├── ValidarFechas.test.ts
│   ├── ValidarSenia.test.ts
│   ├── deleteReserva.test.ts
│   ├── getReservas.test.ts
│   ├── postReserva.test.ts
│   ├── sincronizarEstadoTraje.test.ts
│   ├── updateEstadoReserva.test.ts
│   └── updateReserva.test.ts
├── TrajeController/
│   ├── actualizarParcialTraje.test.ts
│   ├── actualizarTraje.test.ts
│   ├── crearTraje.test.ts
│   ├── eliminarTraje.test.ts
│   └── obtenerTrajes.test.ts
└── middlewares/
    └── validateToken.test.ts
```

En total cubren: los 5 controllers (`ReservaController`, `AuthControllers`, `ClienteController`, `TrajeControllers`, `DashboardController`) y el middleware de autenticación (`validateToken`). Es decir, **todo `src/controllers` y `src/middlewares`** quedó con cobertura de tests unitarios.

---

## 3. Qué prueba cada grupo de tests

**AuthoControllers** — registro de usuario (hash de contraseña, log de éxito/fallo) y login (usuario inexistente, contraseña incorrecta, generación de JWT, error interno). Los 4 casos verifican que nunca se filtre si el usuario o la contraseña fue lo que falló (mismo mensaje de error genérico).

**ClienteController** — los 6 endpoints del CRUD de clientes: alta con detección de DNI/Email duplicado y sanitización de datos, baja lógica (marca `activo: false`, no borra el registro), edición completa y parcial (con control de duplicados y conservación de los campos no enviados), y listado/búsqueda por ID excluyendo clientes inactivos.

**TrajeController** — alta (siempre nace `DISPONIBLE`), búsqueda con filtros dinámicos (`Op.iLike` para texto parcial, match exacto para talle/estado), edición completa y parcial, y baja **con la validación de negocio de que no se puede borrar un traje con reservas pendientes o retiradas**.

**ReservaController** — el más completo: valida seña (0-500), fechas (no en el pasado, devolución posterior al retiro), superposición de fechas para el mismo traje, y sobre todo la sincronización de estados entre `Reserva` y `Traje` (crear reserva → traje `RESERVADO`; retirar → `ALQUILADO`; completar/cancelar/borrar → `DISPONIBLE`).

**DashboardController** — los conteos de stock (total/disponibles/alquilados), el histórico mensual de reservas para el gráfico, las últimas reservas, y el ranking de clientes frecuentes (incluyendo el caso de un cliente que ya no existe).

**validateToken** — las 4 combinaciones de acceso: sin header, header mal formado, token inválido/expirado, y token válido.

---

## 4. Decisiones técnicas importantes (para quien mantenga estos tests)

Estas dos son las más importantes a tener en cuenta si en el futuro agregan más tests o tocan estos archivos:

**1. `jest.spyOn` en vez de `jest.mock()` para los modelos de Sequelize propios (`Traje`, `Reserva`, `Cliente`, `User`).**
`jest.mock('.../Traje')` reemplaza la clase entera por un mock automático. El problema es que `Reserva.ts` define las asociaciones de Sequelize al cargarse (`Traje.hasMany(Reserva)`, `Reserva.belongsTo(Traje)`, etc.), y esas asociaciones necesitan que `Traje` siga siendo una subclase real de `Model`. Si se mockea el módulo completo, esas líneas explotan con `"belongsTo called with something that's not a subclass of Sequelize.Model"`. La solución en todos estos tests es usar `jest.spyOn(Traje, 'findByPk')` (o el método que corresponda), que solo pisa ese método puntual y deja la clase real intacta.

**2. `jest.mock()` completo sí para paquetes externos (`bcrypt`, `jsonwebtoken`).**
Estos paquetes exponen sus funciones con descriptores de propiedad no configurables (típico de bindings nativos), así que `jest.spyOn(bcrypt, 'hash')` falla con `"Cannot redefine property"`. Con paquetes externos no hay riesgo de asociaciones rotas, así que ahí sí se usa `jest.mock('bcrypt')` / `jest.mock('jsonwebtoken')` y se castea el módulo como `jest.Mocked<typeof bcrypt>`.

**3. Nada de fechas hardcodeadas para casos que dependen de "hoy".**
Un test viejo (`ValidarFechas`) usaba una fecha fija como "fecha futura" y dejó de pasar apenas esa fecha quedó en el pasado. Los tests que necesitan una fecha relativa a "hoy" la calculan dinámicamente con `new Date()` en vez de hardcodearla.

---

## 5. Pendiente (fuera del alcance de este commit)

- **Frontend**: los `.spec.ts` que genera Angular por defecto (`dashboard.spec.ts`, `cliente.spec.ts`, etc.) son boilerplate (`expect(component).toBeTruthy()`), no prueban comportamiento real. Si se quiere cobertura real del frontend, quedaría para un commit aparte (servicios, guard, interceptor).
- **Tests de integración/e2e**: no se hicieron. Estos tests son unitarios puros (todo lo que toca base de datos está mockeado); no reemplazan probar la app end-to-end contra una base real.
