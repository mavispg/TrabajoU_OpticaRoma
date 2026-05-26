/**
 * Modelo para interactuar con la API externa de SUNAT/RENIEC (vía APIS.net.pe)
 * Permite buscar datos de DNI y RUC en tiempo real.
 */
export class SunatModel {
    // Token gratuito por defecto de APIS.net.pe (puede cambiarse por uno propio)
    static TOKEN = 'apis-token-1.aTSI1U7KEuT-6bbbCguH-4Y8TI6KS73N';

    /**
     * Consulta información de un DNI en RENIEC.
     * @param {string} dni Número de DNI de 8 dígitos.
     * @returns {Promise<{nombre: string}|null>} Objeto con el nombre completo o null si falla.
     */
    static async queryDni(dni) {
        if (!dni || dni.length !== 8 || isNaN(dni)) return null;

        try {
            const url = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.TOKEN}`
                }
            });

            if (!response.ok) {
                console.warn(`Error al consultar DNI (${response.status}): ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            // Estructura de respuesta de apis.net.pe: nombres, apellidoPaterno, apellidoMaterno
            if (data && data.nombres) {
                const nombreCompleto = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim();
                return { nombre: nombreCompleto };
            }
            return null;
        } catch (error) {
            console.error('Error de red al consultar DNI:', error);
            throw error;
        }
    }

    /**
     * Consulta información de un RUC en SUNAT.
     * @param {string} ruc Número de RUC de 11 dígitos.
     * @returns {Promise<{razonSocial: string}|null>} Objeto con la razón social o null si falla.
     */
    static async queryRuc(ruc) {
        if (!ruc || ruc.length !== 11 || isNaN(ruc)) return null;

        try {
            const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.TOKEN}`
                }
            });

            if (!response.ok) {
                console.warn(`Error al consultar RUC (${response.status}): ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            // Estructura de respuesta de apis.net.pe: razonSocial, etc.
            if (data && data.razonSocial) {
                return { razonSocial: data.razonSocial };
            }
            return null;
        } catch (error) {
            console.error('Error de red al consultar RUC:', error);
            throw error;
        }
    }
}
