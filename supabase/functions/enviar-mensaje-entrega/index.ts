const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizarTelefono(telefono: string) {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { telefono, cliente, codigoVenta, mensaje } = await req.json();
    const token = Deno.env.get('JSON_SMS_TOKEN');
    if (!token) {
      throw new Error('Falta configurar JSON_SMS_TOKEN en Supabase Secrets');
    }

    const number = normalizarTelefono(telefono);
    if (!/^51\d{9}$/.test(number)) {
      throw new Error('El numero debe tener 9 digitos');
    }

    const message = mensaje && String(mensaje).trim()
      ? String(mensaje).trim()
      : `Hola ${cliente || 'cliente'}, tu pedido ${codigoVenta || ''} de Optica Roma ya esta listo para recoger. Gracias por tu preferencia.`;

    const response = await fetch('https://api.sms.json.pe/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        number,
        message
      }),
    });

    const resultText = await response.text();
    let result = null;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch (_) {
      result = null;
    }

    if (!response.ok || result?.success === false) {
      throw new Error(
        result?.message ||
        result?.error ||
        resultText ||
        `No se pudo enviar el SMS. Estado HTTP: ${response.status}`
      );
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
