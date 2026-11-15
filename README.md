# GiShop · Catálogo de indumentaria de Brazilian Jiu-Jitsu

Next.js (App Router) + Supabase, listo para desplegar en Vercel.

- `/` — **Catálogo** público con filtros: búsqueda, marca, tipo (Gi / No-Gi / Otros), subtipo No-Gi (Rushguards / Shorts), talle, color y "solo con stock".
- `/admin` — **Admin** (login con email y contraseña): alta, edición y borrado de modelos, con varios colores por modelo, varias fotos por color y talles + stock por color.

En el catálogo, cada tarjeta muestra los colores del modelo; al elegir un color cambian las fotos y los talles disponibles.

## Estructura

```
app/
  layout.js        layout raíz
  globals.css      estilos
  page.js          catálogo
  admin/page.js    admin (login + listado + stock rápido)
components/
  Header.js
  ProductCard.js   tarjeta con selector de color / fotos / talles
  ModelForm.js     formulario de alta y edición
lib/
  constants.js     tipos, subtipos, talles, marcas sugeridas
  supabase.js      cliente de Supabase
  queries.js       carga de modelos con colores, fotos y talles
supabase/schema.sql
```

## Modelo de datos

`catalog_models` (nombre, marca, tipo, subtipo, precio) → `catalog_colors` → `catalog_images` (varias fotos) y `catalog_variants` (talle + stock). Los talles y el stock pertenecen al **color**, no al modelo.

## Puesta en marcha

1. **Base de datos**: en Supabase abrí *SQL Editor*, pegá `supabase/schema.sql` y ejecutalo. Crea las tablas, las políticas de seguridad y el bucket público `product-images`.
2. **Usuario admin**: en *Authentication → Users* creá un usuario con tu mail y una contraseña (el mail debe coincidir con el de `public.is_admin()` en el SQL y con `NEXT_PUBLIC_ADMIN_EMAIL`).
3. **Variables de entorno**: copiá `.env.example` a `.env.local`.
4. **Local**:
   ```bash
   npm install
   npm run dev
   ```
5. **Vercel**: subí el proyecto a GitHub, importalo en Vercel y cargá las 3 variables `NEXT_PUBLIC_*` en *Settings → Environment Variables*. Deploy.

## Notas

- La seguridad real está en las políticas RLS de Supabase: cualquiera lee el catálogo, solo el mail admin puede escribir (tablas y fotos). La comprobación del mail en el front solo decide qué pantalla mostrar.
- Marcas: en el admin se puede escribir cualquier marca (hay sugerencias en `lib/constants.js`); en el catálogo el filtro se arma con las marcas cargadas.
- Para agregar talles, editá `TALLES` en `lib/constants.js`.
- Las tablas viejas (`product_models`, `product_variants`) no se tocan; podés borrarlas cuando quieras.
