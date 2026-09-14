# Guía Rápida: Clonación, Configuración y Despliegue con Podman

Guía directa y resumida para clonar, configurar, compilar imágenes y poner a funcionar todos los servicios de la plataforma **DomoNow PropTech** en contenedores con **Podman**.

---

## 1. Clonar el Proyecto

Ejecuta en tu terminal para descargar el repositorio y entrar a la raíz:

```bash
# Clonar repositorio
git clone https://github.com/jhoney787813/collection-domonow.git

# Ingresar al directorio del proyecto
cd collection-domonow
```

---

## 2. Configurar el Entorno

### Requisitos Previos
* **Podman** 5.x+ instalado ([podman.io](https://podman.io)).
* **Podman Compose** instalado (`podman-compose`).
* *(Opcional para desarrollo local sin contenedores)*: .NET 10 SDK y Node.js 22+.

### Iniciar Podman Machine (macOS / Windows)
Si usas macOS o Windows, inicializa y arranca la máquina virtual de Podman:

```bash
# Inicializar máquina virtual de Podman con recursos recomendados
podman machine init --cpus 4 --memory 4096 --disk-size 50

# Iniciar la máquina
podman machine start

# Validar que Podman responda
podman system info
```

*(En Linux con Podman rootless nativo, este paso no es necesario).*

---

## 3. Despliegue Rápido (Podman Compose - 1 Solo Comando)

La forma más rápida de levantar todos los 5 servicios interconectados es usando el archivo compose preparado:

```bash
# Construir todas las imágenes y levantar contenedores en segundo plano
podman compose -f podman/podman-compose.yaml up -d --build
```

Para verificar que todos los contenedores estén en estado `Up`:
```bash
podman ps
```

---

## 4. Paso a Paso: Generar Imágenes y Desplegar por Separado en Podman

Si deseas construir cada imagen individualmente y correr los contenedores paso a paso, ejecuta los siguientes comandos desde la raíz del proyecto (`collection-domonow`):

### Paso 4.1: Crear Red y Volumen
```bash
# Crear la red compartida para intercomunicación por DNS
podman network create domonow-network

# Crear volumen persistente para PostgreSQL
podman volume create postgres_data
```

### Paso 4.2: Base de Datos PostgreSQL 17
Descarga y ejecuta la base de datos precargando el esquema DDL y los 30 cupos:
```bash
podman run -d --name domonow-postgres-db \
  --network domonow-network \
  -p 5432:5432 \
  -e POSTGRES_DB=domonow_parking \
  -e POSTGRES_USER=domonow_user \
  -e POSTGRES_PASSWORD=domonow_secret_pass \
  -v "$(pwd)/open-spec/06-database-ddl.sql":/docker-entrypoint-initdb.d/01-init.sql:ro \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:17-alpine
```

### Paso 4.3: Backend .NET 10 API
Construye la imagen multi-stage y corre el contenedor:
```bash
# Construir imagen del backend
podman build -t domonow-backend-api -f podman/Containerfile.backend .

# Ejecutar contenedor de la API (mapeado al puerto 5050 del host)
podman run -d --name domonow-backend-api \
  --network domonow-network \
  -p 5050:5000 \
  -e "ConnectionStrings__DefaultConnection=Host=domonow-postgres-db;Port=5432;Database=domonow_parking;Username=domonow_user;Password=domonow_secret_pass;Include Error Detail=true" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  domonow-backend-api
```

### Paso 4.4: Microfrontend Root Shell (Single-SPA Orquestador)
```bash
# Construir imagen Root MFE
podman build -t domonow-root-mfe -f podman/Containerfile.root-mfe .

# Ejecutar contenedor en puerto 9000
podman run -d --name domonow-root-mfe \
  --network domonow-network \
  -p 9000:9000 \
  domonow-root-mfe
```

### Paso 4.5: Microfrontend Angular 19 (Operaciones de Parqueadero)
```bash
# Construir imagen Angular MFE
podman build -t domonow-angular-mfe -f podman/Containerfile.angular-mfe .

# Ejecutar contenedor en puerto 9001
podman run -d --name domonow-angular-mfe \
  --network domonow-network \
  -p 9001:9001 \
  domonow-angular-mfe
```

### Paso 4.6: Microfrontend Vue 3 (Analítica y Predicciones)
```bash
# Construir imagen Vue MFE
podman build -t domonow-vue-mfe -f podman/Containerfile.vue-mfe .

# Ejecutar contenedor en puerto 9002
podman run -d --name domonow-vue-mfe \
  --network domonow-network \
  -p 9002:9002 \
  domonow-vue-mfe
```

---

## 5. Usar los Proyectos y Poner a Funcionar

### Puertos y URLs de Acceso

| Módulo / Servicio | Tecnología | URL en Navegador | Propósito |
| :--- | :--- | :--- | :--- |
| **Root Shell (Aplicación Principal)** | Single-SPA / Vite | **[http://localhost:9000](http://localhost:9000)** | Login y contenedor unificado |
| **Backend REST API / Swagger** | .NET 10 LTS | **[http://localhost:5050/swagger](http://localhost:5050/swagger)** | Documentación y pruebas interactivas de endpoints |
| **Angular MFE** | Angular 19 Standalone | **[http://localhost:9001](http://localhost:9001)** | Gestión y asignación de cupos P-01 a P-30 |
| **Vue MFE** | Vue 3 Composition | **[http://localhost:9002](http://localhost:9002)** | Gráficas de ocupación y tasa de rotación |
| **PostgreSQL 17** | Base de Datos Relacional | `localhost:5432` | Base de datos `domonow_parking` |

### Credenciales de Acceso al Sistema
Para iniciar sesión en la interfaz web (`http://localhost:9000`):
* **Usuario:** `admin@domonow.com` *(o cualquier correo válido)*
* **Contraseña:** `DomoNow2026!`

---

## 6. Comandos de Diagnóstico, Verificación y Parada

```bash
# Ver estado de los contenedores
podman ps

# Ver logs de un contenedor en tiempo real (ej. backend o root-mfe)
podman logs -f domonow-backend-api
podman logs -f domonow-root-mfe

# Probar la base de datos y verificar los 30 cupos cargados
podman exec -it domonow-postgres-db psql -U domonow_user -d domonow_parking -c "SELECT spot_number, status FROM parking_spots ORDER BY spot_number LIMIT 5;"

# Detener todos los contenedores desplegados con compose
podman compose -f podman/podman-compose.yaml down

# Si desplegaste manualmente contenedor por contenedor, detener y eliminar:
podman stop domonow-vue-mfe domonow-angular-mfe domonow-root-mfe domonow-backend-api domonow-postgres-db
podman rm domonow-vue-mfe domonow-angular-mfe domonow-root-mfe domonow-backend-api domonow-postgres-db
```

---

## 7. Ejecución en Localhost (Ambiente de Desarrollo sin Contenedores)

Si deseas trabajar directamente en tu entorno local (desarrollo rápido con hot-reload sin empaquetar en contenedores):

### Prerrequisitos Locales
* **.NET 10 SDK** (`dotnet --version`)
* **Node.js 22+** y **npm** (`node -v`, `npm -v`)
* **PostgreSQL 17** (puedes usar una instancia local o levantar **únicamente** la base de datos con Podman).

---

### Paso a Paso para Correr en Localhost

#### Paso 7.1: Levantar la Base de Datos PostgreSQL
La forma más simple es usar Podman solo para la base de datos:
```bash
# Iniciar solo el contenedor de PostgreSQL con su seed DDL automático
podman compose -f podman/podman-compose.yaml up -d postgres-db
```
*(Si ya tienes PostgreSQL instalado nativamente en tu máquina en el puerto 5432, carga el esquema ejecutando: `psql -U domonow_user -d domonow_parking -f open-spec/06-database-ddl.sql`).*

#### Paso 7.2: Ejecutar el Backend .NET 10 (Terminal 1)
Desde la raíz del repositorio:
```bash
# Restaurar dependencias y compilar
dotnet restore src/backend/DomoNow.Parking.sln

# Ejecutar la API en el puerto 5050 (requerido por los microfrontends)
dotnet run --project src/backend/DomoNow.Parking.Api --urls "http://localhost:5050"
```
> Swagger estará disponible en: **[http://localhost:5050/swagger](http://localhost:5050/swagger)**

#### Paso 7.3: Compilar Tokens Compartidos de UI
Antes de arrancar los microfrontends, compila la librería de estilos compartida:
```bash
cd src/frontend/domonow-ui-tokens
npm install
npm run build
cd ../../..
```

#### Paso 7.4: Iniciar los Microfrontends (Terminales 2, 3 y 4)

Abre tres terminales independientes:

* **Terminal 2 — Root Shell (Single-SPA Orquestador - Puerto 9000):**
  ```bash
  cd src/frontend/root-config
  npm install
  npm run start
  ```

* **Terminal 3 — Angular 19 MFE (Operaciones de Parqueadero - Puerto 9001):**
  ```bash
  cd src/frontend/domonow-angular-parking
  npm install
  npm run start
  ```

* **Terminal 4 — Vue 3 MFE (Analítica y Demanda - Puerto 9002):**
  ```bash
  cd src/frontend/domonow-vue-analytics
  npm install
  npm run start
  ```

#### Paso 7.5: Abrir la Aplicación en el Navegador
* Ve a: **[http://localhost:9000](http://localhost:9000)**
* Inicia sesión con:
  * **Usuario:** `admin@domonow.com`
  * **Contraseña:** `DomoNow2026!`

