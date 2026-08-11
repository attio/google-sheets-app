import {describe, expect, it} from "vitest"
import {computeBackoffMs, isRetryableStatus, parseRetryAfter} from "../retry"

describe("isRetryableStatus", () => {
    it("retries rate limiting and gateway errors", () => {
        expect(isRetryableStatus(429)).toBe(true)
        expect(isRetryableStatus(502)).toBe(true)
        expect(isRetryableStatus(503)).toBe(true)
        expect(isRetryableStatus(504)).toBe(true)
    })

    it("does not retry other statuses", () => {
        for (const status of [200, 400, 401, 403, 404, 500, 501]) {
            expect(isRetryableStatus(status)).toBe(false)
        }
    })
})

describe("parseRetryAfter", () => {
    const now = Date.parse("2026-01-01T00:00:00Z")

    it("returns null when absent or blank", () => {
        expect(parseRetryAfter(null, now)).toBeNull()
        expect(parseRetryAfter("  ", now)).toBeNull()
    })

    it("parses delta-seconds into milliseconds", () => {
        expect(parseRetryAfter("120", now)).toBe(120_000)
        expect(parseRetryAfter("0", now)).toBe(0)
    })

    it("parses an HTTP date relative to now", () => {
        const header = new Date(now + 10_000).toUTCString()
        expect(parseRetryAfter(header, now)).toBe(10_000)
    })

    it("clamps past dates to zero", () => {
        const header = new Date(now - 10_000).toUTCString()
        expect(parseRetryAfter(header, now)).toBe(0)
    })

    it("returns null for unparseable values", () => {
        expect(parseRetryAfter("soon", now)).toBeNull()
    })
})

describe("computeBackoffMs", () => {
    it("grows exponentially and stays within [base*2^n, +jitter], capped", () => {
        const cases = [
            {attempt: 0, floor: 500, ceil: 1000},
            {attempt: 1, floor: 1000, ceil: 1500},
            {attempt: 2, floor: 2000, ceil: 2500},
            {attempt: 4, floor: 8000, ceil: 8500},
            {attempt: 6, floor: 8000, ceil: 8500},
        ]
        for (const {attempt, floor, ceil} of cases) {
            // Sample several times to exercise jitter.
            for (let i = 0; i < 20; i++) {
                const delay = computeBackoffMs(attempt)
                expect(delay).toBeGreaterThanOrEqual(floor)
                expect(delay).toBeLessThanOrEqual(ceil)
            }
        }
    })
})
