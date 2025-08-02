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
        // Retorna os dados originais se não houver esquema
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
export const validateEventData = (eventSource: string, data: any) => {
    const schema = loadSchema(eventSource);
    if (!schema) {
        return { isValid: true, errors: [] }; // Nenhum esquema, então tudo é válido
    }

    const errors: string[] = [];
    for (const key in data) {
        const field = schema.fields[key];
        if (!field) {
            errors.push(`Campo desconhecido: ${key}`);
            continue;
        }

        // Exemplo simples de validação de tipo
        if (field.type === 'STRING' && typeof data[key] !== 'string' && data[key] !== null) {
            errors.push(`Campo '${key}' deve ser uma string.`);
        }
        if (field.type === 'TEXT' && typeof data[key] !== 'string' && data[key] !== null) {
            errors.push(`Campo '${key}' deve ser um texto.`);
        }
        // Adicione outras validações conforme necessário...
    }

    // Verifique campos obrigatórios
    for (const key in schema.fields) {
        const field = schema.fields[key];
        if (field.validation?.required && (data[key] === undefined || data[key] === null || data[key] === '')) {
            errors.push(`Campo '${key}' é obrigatório.`);
        }
    }

    return { isValid: errors.length === 0, errors };
};