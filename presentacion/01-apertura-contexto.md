# 📺 TELEPROMPTER 01 — Apertura y Contexto del Problema
## ⏱️ Duración estimada: 3 minutos
## 🎯 Cubre: Comunicación Técnica (5%)

---

> [[ RESPIRA PROFUNDO. PAUSA DE 2 SEGUNDOS ANTES DE EMPEZAR. ]]
> [[ CONTACTO VISUAL DIRECTO CON EL EVALUADOR. ]]

---

## APERTURA

Buenos días / buenas tardes.

Mi nombre es **Jhon Edison Hincapié García**, Solutions Architect y Senior Full Stack Engineer.

Voy a presentarles mi solución a la prueba técnica de OFIMA SAS, que es el sistema **DomoNow — Gestión de Parqueaderos de Visitantes**.

Antes de entrar en código, quiero hablarles **del problema real** que este sistema resuelve, porque todo el criterio técnico de la solución nace de entender el problema correctamente.

---

## EL PROBLEMA DE NEGOCIO

Imaginen un conjunto residencial grande — tres torres, trescientos apartamentos, treinta cupos de parqueadero comunal para visitantes: `P-01` hasta `P-30`.

Son las seis de la tarde de un viernes. Dos guardias en postos distintos reciben al mismo tiempo dos vehículos de visitantes. Los dos miran la pantalla. El cupo `P-15` aparece disponible en los dos computadores.

Los dos hacen clic. Los dos registran. Y ahora hay dos vehículos asignados físicamente al mismo cupo.

**Eso es una condición de carrera.** Es un *race condition*. Y en el mundo físico, no se resuelve con un mensaje de error — se resuelve con un guardia saliendo a la calle a decirle a alguien que espere, mientras la talanquera ya está levantada.

**El reto central de esta prueba no es construir un CRUD.** El reto es garantizar — matemáticamente, no con lógica de aplicación — que eso nunca puede ocurrir, sin importar cuántos usuarios simultáneos haya.

Y eso fue exactamente lo que diseñé.

---

## POR QUÉ IMPORTA LA ESCALA

La especificación menciona que DomoNow opera en propiedades de alta densidad. En el `open-spec/00-system-overview.md` que escribí, documenté la visión de escalar a cinco mil propiedades con más de cien mil movimientos diarios.

Eso cambia absolutamente las decisiones técnicas. No es lo mismo diseñar para un guardia que para mil guardias concurrentes en distintos conjuntos.

**Esa diferencia de escala es lo que separa un sistema que funciona en demo de uno que funciona en producción.**

---

## ESTRUCTURA DE LA SOLUCIÓN

Lo que construí es una plataforma completa en tres capas:

- **Un backend en .NET 10 LTS** con Clean Architecture, CQRS y control de concurrencia de doble capa
- **Dos microfrontends** — Angular 19 para operaciones de portería, Vue 3 para analítica predictiva — orquestados con Single-SPA
- **Una base de datos PostgreSQL 17** en Podman con inicialización automática y restricciones físicas de unicidad

Y todo documentado en un sistema de especificaciones formales que llamé **OpenSpec** — ocho archivos que definen el dominio, los contratos API, la arquitectura y las decisiones de ingeniería.

[[ PAUSA. ]]

Antes de continuar — una aclaración sobre el tiempo. La prueba sugiere seis horas. Yo tomé una decisión deliberada: en lugar de hacer muchas funcionalidades a medias, **elegí hacer menos cosas pero hacerlas con criterio de producción**. Esa fue mi primera decisión técnica.

---

## PREGUNTA ANTICIPADA

**P: "¿Por qué eligió esta arquitectura tan compleja para una prueba técnica?"**

R: Porque ustedes no evaluaron si yo sé construir un CRUD — eso lo hace cualquier desarrollador. Ustedes evaluaron **cómo analizo un problema, cómo estructuro una solución y cómo decido cuándo no confiar en lo que genera una herramienta de IA**. La complejidad está justificada por el problema, no elegida por capricho técnico.
