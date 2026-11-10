# Evaluación sensorial de atún enlatado

Repositorio del proyecto. La interfaz se publica con GitHub Pages y el backend
corre en Google Apps Script, que guarda los resultados en Google Sheets.

## Estructura

| Carpeta / archivo | Qué es | Dónde vive en producción |
|---|---|---|
| `docs/` | Interfaz (HTML, CSS, JS e imagen) | GitHub Pages |
| `backend/` | Código de Apps Script (`Code.gs`, `Web.gs`, `appsscript.json`) | Proyecto de Apps Script vinculado a la hoja |
| `.clasp.json` | Liga la carpeta `backend/` con el proyecto de Apps Script | Local (clasp) |

GitHub guarda el código fuente. clasp sincroniza `backend/` con Apps Script.
La interfaz se conecta al backend mediante la URL de la Web App (`/exec`).

## Puesta en marcha

1. **Backend.** Crea el proyecto de Apps Script desde la hoja de cálculo
   (Extensiones > Apps Script), sube `backend/` con clasp o copia los archivos
   a mano, ejecuta `configurarHojas` desde el menú **Sensorial** y define la
   propiedad `CONTRASENA_EXPORTACION`.
2. **Web App.** En Apps Script: **Implementar > Nueva implementación > Aplicación web**.
   Ejecutar como: **Yo**. Acceso: **Cualquier persona**. Copia la URL que termina en `/exec`.
3. **Conectar la interfaz.** En `docs/app.js`, reemplaza `PEGA_AQUI_LA_URL_EXEC`
   por esa URL y haz commit.
4. **GitHub Pages.** En el repositorio: **Settings > Pages**, origen **Deploy from a branch**,
   rama `main`, carpeta `/docs`. La dirección será `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

## Actualizar el backend con clasp (opcional)

```bash
npm install -g @google/clasp
clasp login
clasp push          # sube backend/ al proyecto de Apps Script
clasp deploy        # crea una nueva versión (la URL /exec se mantiene)
```

Si cambias el backend y no creas una nueva versión, la Web App seguirá usando
la versión anterior.

## Exportar resultados

En la hoja de cálculo: **Sensorial > Exportar a Excel (.xlsx)**. Pide la
contraseña de `CONTRASENA_EXPORTACION` y crea el archivo en tu Google Drive.

## Pruebas antes de la sesión

- Un envío completo desde computadora y desde celular (Chrome, Safari y la app de WhatsApp).
- Revisa que las filas aparezcan en `Participantes`, `Evaluaciones` y `Preferencias`.
- Borra las filas de prueba antes de la sesión real.
