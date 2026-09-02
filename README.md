# ALQUITRA - Sistema de Gestión de Alquiler de Trajes

ALQUITRA es una plataforma web integral "Full Stack" desarrollada para administrar de manera eficiente el inventario, los clientes y las reservas de un negocio de alquiler de trajes de patinaje artístico.

## 🚀 Características Principales

### 🛼 Inventario de Trajes
- **Gestión completa:** Alta, baja y modificación de trajes de patín artístico.
- **Categorización:** Soporte para talles, colores y categorías.
- **Control de Stock:** Visualización en tiempo real de trajes disponibles y control de cantidades.

### 👥 Gestión de Clientes
- **Directorio de clientes:** Registro detallado con nombre, DNI, teléfono y correo electrónico.
- **Fácil búsqueda:** Buscador integrado para encontrar rápidamente el perfil de cada cliente.

### 📅 Sistema de Reservas
- **Ciclo de vida de la reserva:** Estados dinámicos (`Pendiente`, `Retirado`, `Completado`, `Cancelado`).
- **Disponibilidad Inteligente:** El sistema detecta cruces de fechas y previene reservas simultáneas del mismo traje.
- **Panel Interactivo:** Visualización clara de fechas de retiro y devolución.

### 📊 Dashboard y Estadísticas
- Panel de control principal con KPIs en tiempo real.
- Visualización rápida de métricas clave (total de clientes, trajes en inventario, reservas activas, etc.).

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express:** Servidor robusto y escalable.
- **TypeScript:** Tipado fuerte para evitar errores en tiempo de ejecución.
- **PostgreSQL + Sequelize:** Base de datos relacional principal para la lógica de negocio (ORM).
- **MongoDB + Mongoose:** Base de datos NoSQL auxiliar dedicada al registro de auditoría (Logs y trazabilidad).
- **Swagger (OpenAPI 3.0):** Documentación automática y testeable de los endpoints REST en `/api-docs`.

### Frontend
- **Angular:** Framework principal (SPA).
- **Angular Material:** Sistema de diseño avanzado para una interfaz de usuario fluida, moderna y accesible.
- **Diseño Premium:** Temática visual elegante con colores oscuros, desenfoques y animaciones fluidas, acorde al rubro de indumentaria deportiva.

## ⚙️ Requisitos Previos e Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Romann2004/ALQUITRA.git
   ```

2. **Levantar Bases de Datos:**
   ```bash
   docker-compose up -d
   ```

3. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run start
   ```
   *La aplicación estará disponible en `http://localhost:4200` y la API en `http://localhost:3000/api`.*

---

## 👥 Equipo Integrante (Proyecto de Seminario)

Este sistema fue desarrollado por:
- **Roman Burgués**
- **Thomas Ulises Gonzalez**
- **Joaquín Díaz Gamboggi**
- **Manuel Pérez**
