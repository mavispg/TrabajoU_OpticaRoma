alter table ventas add column if not exists dni_cliente text;
alter table ventas add column if not exists celular_cliente text;
alter table ventas add column if not exists estado_entrega text default 'EN PROCESO';

create table if not exists pagos_venta (
    id uuid primary key default gen_random_uuid(),
    venta_id text,
    codigo_venta text,
    nombre_cliente text,
    fecha_pago date not null,
    monto numeric not null default 0,
    modalidad_pago text not null default 'EFECTIVO',
    usuario text,
    tipo text not null default 'ABONO',
    created_at timestamptz not null default now()
);

create table if not exists cotizaciones (
    id uuid primary key default gen_random_uuid(),
    cliente_id text,
    nombre_cliente text,
    celular text,
    detalle text,
    extra text,
    monto numeric not null default 0,
    canal text not null default 'WHATSAPP',
    mensaje text,
    estado text not null default 'ENVIADA',
    fecha date not null,
    created_at timestamptz not null default now()
);
