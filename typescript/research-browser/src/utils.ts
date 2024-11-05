export async function* fetchJsonl<T>(url: string): AsyncIterable<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    if (!response.body) throw new Error('No response body');

    const processLine = (line: string): T | undefined => {
        if (line.length === 0) return;
        try {
            return JSON.parse(line);
        } catch (_e) {
            console.error(`Faled to parse json: ${line}`);
            return;
        }
    };

    let buffer = '';
    const stream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
            new TransformStream({
                transform(chunk: string, controller) {
                    buffer += chunk;
                    const lastNewlineIndex = buffer.lastIndexOf('\n');

                    if (lastNewlineIndex !== -1) {
                        const fullLines = buffer.slice(0, lastNewlineIndex).split('\n');
                        buffer = buffer.slice(lastNewlineIndex + 1);

                        for (const line of fullLines) {
                            const result = processLine(line);
                            if (result !== undefined) controller.enqueue(result);
                        }
                    }
                },
                flush(controller) {
                    if (buffer.length > 0) {
                        const leftoverLines = buffer.split('\n');
                        for (const line of leftoverLines) {
                            const result = processLine(line);
                            if (result !== undefined) controller.enqueue(result);
                        }
                    }
                },
            }),
        );

    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield value as T;
        }
    } finally {
        reader.releaseLock();
    }
}

export function mockStream(chunks: string[]) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
        },
    });
}
