import fs from 'fs';
import path from 'path';
import { logger } from './logger';


export const loadSchema = (eventSource: string) => {
    try {
        const filePath = path.join(__dirname, `../event_schemas/${eventSource}_schema.json`);
        const schema = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(schema);
    } catch (error) {
        logger.error('schema_handler', `Erro ao carregar o esquema para ${eventSource}`, error);
        return null;
    }
};


export const hydrateEventWithSchema = (eventSource: string, eventData: any) => {
    const schema = loadSchema(eventSource);
    if (!schema) {
        return eventData;
    }

    const hydratedData: any = {};
    for (const key in schema.fields) {

        if (eventData && eventData[key] !== undefined) {
            hydratedData[key] = eventData[key];
        } else {
            hydratedData[key] = null;
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

export type FormFieldSchema = {
    name: string;
    type: string;
    options?: string[];
    required?: boolean;
    label?: string;
    [key: string]: any;
};

export function validateFormSchema(schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Array.isArray(schema)) {
        errors.push('Schema deve ser um array de campos.');
        return { valid: false, errors };
    }
    schema.forEach((field, idx) => {
        if (typeof field !== 'object' || field === null) {
            errors.push(`Campo na posição ${idx} não é um objeto.`);
            return;
        }
        if (typeof field.name !== 'string' || !field.name.trim()) {
            errors.push(`Campo na posição ${idx} está sem nome válido.`);
        }
        if (typeof field.type !== 'string' || !field.type.trim()) {
            errors.push(`Campo na posição ${idx} está sem tipo válido.`);
        }
        if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length === 0)) {
            errors.push(`Campo '${field.name}' na posição ${idx} do tipo 'select' precisa de opções.`);
        }
    });
    return { valid: errors.length === 0, errors };
}

export const exampleSchemas = [
    [
        { name: 'age', type: 'select', options: ['18-24', '25-34', '35-44'], required: true, label: 'Idade' },
        { name: 'email', type: 'email', required: true, label: 'E-mail' },
        { name: 'modality', type: 'select', options: ['presencial', 'online'], required: true, label: 'Modalidade' }
    ],
    [
        { name: 'name', type: 'text', required: true, label: 'Nome completo' },
        { name: 'phone', type: 'tel', required: false, label: 'Telefone' },
        { name: 'imageConsent', type: 'checkbox', required: false, label: 'Autoriza uso de imagem?' }
    ]
];

