const API_TOKEN = '16bbde24be08eaaba2dc1baf506478208e2ae9b32eeeb712aa774510fd58';
const API_BASE_URL = 'https://api.json.pe/api';

async function consultar(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.success === false) {
        throw new Error(result?.message || 'No se encontraron datos para el documento ingresado');
    }

    return result.data;
}

export class ConsultaDocumentoModel {
    static async consultarDni(dni) {
        if (!/^\d{8}$/.test(dni)) {
            throw new Error('El DNI debe tener 8 digitos');
        }

        const data = await consultar('dni', { dni });

        return {
            numero: data.numero || dni,
            nombreCompleto: data.nombre_completo || [
                data.apellido_paterno,
                data.apellido_materno,
                data.nombres
            ].filter(Boolean).join(' ')
        };
    }

    static async consultarRuc(ruc) {
        if (!/^\d{11}$/.test(ruc)) {
            throw new Error('El RUC debe tener 11 digitos');
        }

        const data = await consultar('ruc', { ruc });

        return {
            ruc: data.ruc || ruc,
            razonSocial: data.nombre_o_razon_social || data.razon_social || '',
            direccion: data.direccion_completa || data.direccion || '',
            estado: data.estado || '',
            condicion: data.condicion || ''
        };
    }
}
