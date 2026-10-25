import OpenAI from 'openai';
import {
    MACHINE_SPIRIT_CONFIG,
    OPENAI_CLIENT_CONFIG,
    OPENAI_RESPONSE_CONFIG,
} from '../config/openai.conf.js';
import { buildMachineSpiritContext } from './machine-spirit-context.js';
import type { PortfolioService } from './portfolio.js';
import type { SpiritStream } from '../app.js';

export type SpiritResponder = (input: string) => Promise<SpiritStream>;
export function createMachineSpirit(portfolio: PortfolioService, respond?: SpiritResponder) {
    return async (query: string): Promise<SpiritStream> => {
        const normalizedQuery = query.trim();
        if (
            !normalizedQuery.length ||
            normalizedQuery.length > MACHINE_SPIRIT_CONFIG.maxUserQueryLength
        )
            throw new Error('Invalid query length.');
        // Read the same content service before contacting OpenAI. A DB failure makes no API call.
        const context = await buildMachineSpiritContext(portfolio);
        const input = `PORTFOLIO CONTEXT\n${context}\n\nVISITOR QUESTION\n${normalizedQuery}`;
        if (respond) return respond(input);
        const client = new OpenAI(OPENAI_CLIENT_CONFIG);
        return client.responses.create({ ...OPENAI_RESPONSE_CONFIG, stream: true, input });
    };
}
