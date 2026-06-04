import OpenAI from "openai";
import { 
    MACHINE_SPIRIT_CONFIG, 
    OPENAI_CLIENT_CONFIG, 
    OPENAI_RESPONSE_CONFIG } 
from '../config/openai.conf';
import { buildMachineSpiritContext } from "./machine-spirit-context";

const client = new OpenAI(OPENAI_CLIENT_CONFIG)

export async function askMachineSpirit(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery.length) {
        throw new Error('No query provided')
    }

    if (normalizedQuery.length > MACHINE_SPIRIT_CONFIG.maxUserQueryLength) {
        throw new Error('Query exceeds cogitator limits.');
    }

    try {
        const context = await buildMachineSpiritContext(query);

        const response = await client.responses.create({
            ...OPENAI_RESPONSE_CONFIG,
            input: `
                PORTFOLIO CONTEXT
                ${context}

                VISITOR QUESTION
                ${normalizedQuery}
            `,
        })

        console.log(response)

        return response.output_text;
    } catch(e) {
        console.error(e)
        throw new Error('Machine Spirit Unavailable')
    }
} 