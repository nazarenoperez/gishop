-- GiShop · migración de subtipos
-- Para la base que YA tenés creada. Ejecutalo completo en:
-- Supabase > SQL Editor > New query > Run
--
-- Nuevos subtipos:
--   gi     -> kimonos, faixas
--   no-gi  -> rushguard, shorts
--   otros  -> mochilas, remeras, buzos, gorras
--
-- No borra ni cambia fotos, colores ni talles.

-- 1) Quitar las restricciones anteriores sobre el subtipo
alter table catalog_models drop constraint if exists subtipo_solo_no_gi;
alter table catalog_models drop constraint if exists catalog_models_subtipo_check;

-- 2) Los productos "gi" que ya cargaste pasan a ser "kimonos"
update catalog_models
   set subtipo = 'kimonos'
 where tipo = 'gi' and subtipo is null;

-- 3) Nueva regla: todo producto tiene subtipo y debe corresponder a su tipo.
--    "not valid" = se exige para productos nuevos y para los que edites;
--    no frena la migración si algún producto "otros" viejo no tiene subtipo.
alter table catalog_models drop constraint if exists subtipo_segun_tipo;
alter table catalog_models add constraint subtipo_segun_tipo check (
  subtipo is not null and (
    (tipo = 'gi' and subtipo in ('kimonos', 'faixas')) or
    (tipo = 'no-gi' and subtipo in ('rushguard', 'shorts')) or
    (tipo = 'otros' and subtipo in ('mochilas', 'remeras', 'buzos', 'gorras'))
  )
) not valid;

-- 4) Control: tiene que devolver 0 filas.
--    Si devuelve productos, abrilos desde /admin y elegí su subtipo.
select id, nombre, tipo, subtipo
  from catalog_models
 where subtipo is null
    or not (
      (tipo = 'gi' and subtipo in ('kimonos', 'faixas')) or
      (tipo = 'no-gi' and subtipo in ('rushguard', 'shorts')) or
      (tipo = 'otros' and subtipo in ('mochilas', 'remeras', 'buzos', 'gorras'))
    );
