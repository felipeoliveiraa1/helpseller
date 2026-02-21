import OpenAI from 'openai';
import { env } from '../../shared/config/env.js';

export class OpenAIClient {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    async streamCoaching(systemPrompt: string, userPrompt: string): Promise<string> {
        let fullResponse = '';

        const stream = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 500,
            temperature: 0.3,
            stream: true,
            response_format: { type: 'json_object' }
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            fullResponse += delta;
        }

        return fullResponse;
    }

    async analyzePostCall(systemPrompt: string, userPrompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        return response.choices[0]?.message?.content || '{}';
    }

    async completeJson<T>(systemPrompt: string, userPrompt: string): Promise<T | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 500,
                temperature: 0.2,
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return null;
            return JSON.parse(content) as T;
        } catch (error) {
            console.error("OpenAI completeJson Error", error);
            return null;
        }
    }
}

export const openaiClient = new OpenAIClient();
