import fs from 'fs';
import path from 'path';

// Carrega o esquema do arquivo JSON
export const loadSchema = (eventSource: string) => {
    try {
        const filePath = path.join(__dirname, `../event_schemas/${eventSource}_schema.json`);
        const schema = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(schema);
    } catch (error) {
        console.error(`Erro ao carregar o esquema para ${eventSource}:`, error);
        return null;
    }
};

// Preenche um evento com base no esquema de referência
export const hydrateEventWithSchema = (eventSource: string, eventData: any) => {
    const schema = loadSchema(eventSource);
    if (!schema) {
        return eventData;
    }

    const hydratedData: any = {};
    for (const key in schema.fields) {
        //const field = schema.fields[key];
        // Se o campo existe no evento, use-o; senão, use o valor padrão do esquema
        if (eventData && eventData[key] !== undefined) {
            hydratedData[key] = eventData[key];
        } else {
            hydratedData[key] = null; // Ou field.default
        }
    }
    return hydratedData;
};

// Valida os dados de entrada com base no esquema
export const validateEventPageData = (eventSource: string, data: any) => {
    const schema = loadSchema(eventSource);
    if (!schema) {
        // Se não houver esquema, a validação é ignorada, retornando um estado válido
        return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

    for (const key in data) {
        const field = schema.fields[key];

        // Se o campo não está no esquema, é um campo desconhecido
        if (!field) {
            errors.push(`Campo desconhecido: ${key}`);
            continue;
        }

        const value = data[key];

        // Validação de tipo genérica
        if (field.type === 'STRING' && typeof value !== 'string' && value !== null) {
            errors.push(`Campo '${key}' deve ser uma string.`);
        }
        if (field.type === 'TEXT' && typeof value !== 'string' && value !== null) {
            errors.push(`Campo '${key}' deve ser um texto.`);
        }
        if (field.type === 'ARRAY' && !Array.isArray(value) && value !== null) {
            errors.push(`Campo '${key}' deve ser um array.`);
        }
        if (field.type === 'NUMBER' && typeof value !== 'number' && value !== null) {
            errors.push(`Campo '${key}' deve ser um número.`);
        }
        if (field.type === 'DATE' && value !== null) {
            // Verifica se o valor é uma string e se pode ser parseada como uma data válida
            if (typeof value !== 'string' || isNaN(Date.parse(value))) {
                errors.push(`Campo '${key}' deve ser uma data válida no formato ISO 8601.`);
            }
        }

        // Validação para o tipo 'URL'
        if (field.type === 'URL' && value !== null) {
            // Verifica se o valor é uma string e se corresponde ao regex de URL
            if (typeof value !== 'string' || !urlRegex.test(value)) {
                errors.push(`Campo '${key}' deve ser um link válido.`);
            }
        }
    }

    for (const key in schema.fields) {
        const field = schema.fields[key];
        const value = data[key];

        if (field.validation?.required && (value === undefined || value === null || value === '')) {
            errors.push(`Campo '${key}' é obrigatório.`);
        }
    }

    return { isValid: errors.length === 0, errors };
};