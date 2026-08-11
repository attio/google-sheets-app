// Bounded retries so that total wait time stays under the 30s execution limit.
export const MAX_ATTEMPTS = 4
export const MAX_TOTAL_MS = 20_000
const BASE_MS = 500
const MAX_DELAY_MS = 8_000

export function isRetryableStatus(status: number): boolean {
    return status === 429 || status === 502 || status === 503 || status === 504
}

export function parseRetryAfter(headerValue: string | null, nowMs: number): number | null {
    if (headerValue === null) return null
    const trimmed = headerValue.trim()
    if (trimmed === "") return null

    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed) * 1000
    }

    const dateMs = Date.parse(trimmed)
    if (!Number.isNaN(dateMs)) {
        return Math.max(0, dateMs - nowMs)
    }

    return null
}

export function computeBackoffMs(attempt: number): number {
    const capped = Math.min(MAX_DELAY_MS, BASE_MS * 2 ** attempt)
    const jitter = Math.random() * BASE_MS
    return Math.round(capped + jitter)
}
