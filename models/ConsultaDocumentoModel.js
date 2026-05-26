const API_TOKEN = '16bbde24be08eaaba2dc1baf506478208e2ae9b32eeeb712aa774510fd58';
const API_BASE_URL = 'https://api.json.pe/api';

import { SunatModel } from './SunatModel.js';

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
        let nombreCompleto = data.nombre_completo || [
            data.apellido_paterno,
            data.apellido_materno,
            data.nombres
        ].filter(Boolean).join(' ');

        if (this.hasInvalidCharacters(nombreCompleto)) {
            const respaldo = await this.consultarDniRespaldo(dni);
            if (respaldo && !this.hasInvalidCharacters(respaldo)) {
                nombreCompleto = respaldo;
            }
        }

        return {
            numero: data.numero || dni,
            nombreCompleto: this.fixCommonEncodingIssues(nombreCompleto)
        };
    }

    static async consultarDniRespaldo(dni) {
        try {
            const persona = await SunatModel.queryDni(dni);
            return persona?.nombre || '';
        } catch (error) {
            console.warn('No se pudo consultar DNI en API de respaldo:', error);
            return '';
        }
    }

    static hasInvalidCharacters(value) {
        return String(value || '').includes('\uFFFD');
    }

    static fixCommonEncodingIssues(value) {
        return String(value || '')
            .replace(/MU\uFFFDOZ/g, 'MU\u00D1OZ')
            .replace(/NU\uFFFDEZ/g, 'NU\u00D1EZ')
            .replace(/PE\uFFFDA/g, 'PE\u00D1A')
            .replace(/ORDO\uFFFDEZ/g, 'ORDO\u00D1EZ')
            .replace(/DUE\uFFFDAS/g, 'DUE\u00D1AS')
            .replace(/IBA\uFFFDEZ/g, 'IBA\u00D1EZ')
            .replace(/CASTA\uFFFDEDA/g, 'CASTA\u00D1EDA')
            .replace(/ACU\uFFFDA/g, 'ACU\u00D1A')
            .replace(/MA\uFFFDUCO/g, 'MA\u00D1UCO')
            .replace(/\s+/g, ' ')
            .trim();
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
