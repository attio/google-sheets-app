/**
 * Thin `fetch`-based client for the Google Sheets and Drive REST APIs.
 *
 * We deliberately do NOT use Google's official clients (`googleapis`,
 * `@googleapis/sheets`, `@googleapis/drive`). They depend on
 * `googleapis-common` → `gaxios` + `google-auth-library`, which statically
 * import Node core modules (`crypto`, `http2`, `https`, `fs`, `child_process`,
 * `stream`, …) plus `node-fetch`.
 */
import {type AsyncResult, complete, errored} from "@attio/fetchable"
import {getUserConnection} from "attio/server"
import type {z} from "zod"
import {toErrorMessage} from "../utils/error"
import {createLogger} from "../utils/logger"
import {type GoogleApiError, mapStatusToErrorCode} from "./errors"
import {
    computeBackoffMs,
    isRetryableStatus,
    MAX_ATTEMPTS,
    MAX_TOTAL_MS,
    parseRetryAfter,
} from "./retry"

const logger = createLogger("google-sheets/request")

type Method = "GET" | "POST" | "PUT" | "PATCH"

type GoogleRequestOptions<T> = {
    method: Method
    path: string
    query?: Record<string, string>
    body?: unknown
    schema: z.ZodType<T>
}

function extractApiErrorMessage(text: string): string | null {
    try {
        const parsed: unknown = JSON.parse(text)
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "error" in parsed &&
            typeof (parsed as {error: unknown}).error === "object" &&
            (parsed as {error: unknown}).error !== null
        ) {
            const inner = (parsed as {error: {message?: unknown}}).error
            if (typeof inner.message === "string") {
                return inner.message
            }
        }
    } catch {}
    return null
}

async function readErrorDetail(response: Response): Promise<string> {
    try {
        const text = await response.text()
        return extractApiErrorMessage(text) ?? text ?? response.statusText
    } catch {
        return response.statusText
    }
}

async function parseBody<T>(
    response: Response,
    schema: z.ZodType<T>,
    ctx: {method: Method; path: string}
): AsyncResult<T, GoogleApiError> {
    let json: unknown
    try {
        json = await response.json()
    } catch (err) {
        const detail = toErrorMessage(err)
        logger.error("Failed to parse Google response", {...ctx, detail})
        return errored({code: "PARSE_ERROR", detail})
    }

    const parsed = schema.safeParse(json)
    if (!parsed.success) {
        logger.error("Google response failed schema validation", {
            ...ctx,
            detail: parsed.error.message,
        })
        return errored({code: "PARSE_ERROR", detail: parsed.error.message})
    }
    return complete(parsed.data)
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function googleRequest<T>(
    baseUrl: string,
    options: GoogleRequestOptions<T>
): AsyncResult<T, GoogleApiError> {
    const {method, path, query, body, schema} = options
    const queryString = query
        ? Object.entries(query)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
              .join("&")
        : ""
    const url = baseUrl + path + (queryString ? `?${queryString}` : "")

    // getUserConnection() must NOT be wrapped in try/catch: it throws special
    // errors that power the connection dialog in the Attio UI.
    const accessToken = getUserConnection().value
    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined ? {"Content-Type": "application/json"} : {}),
    }
    const requestBody = body !== undefined ? JSON.stringify(body) : undefined

    const startMs = Date.now()

    // Transient HTTP failures (429/5xx) are retried here with backoff. Network
    // errors are returned as NETWORK_ERROR and are retried at the workflow layer.
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let response: Response
        try {
            response = await fetch(url, {method, headers, body: requestBody})
        } catch (err) {
            const detail = toErrorMessage(err)
            logger.error("Network error talking to Google", {method, path, detail})
            return errored({code: "NETWORK_ERROR", detail})
        }

        if (response.ok) {
            return parseBody(response, schema, {method, path})
        }

        const status = response.status
        const detail = await readErrorDetail(response)
        const delay = isRetryableStatus(status)
            ? (parseRetryAfter(response.headers.get("Retry-After"), Date.now()) ??
              computeBackoffMs(attempt))
            : 0
        const isLastAttempt = attempt === MAX_ATTEMPTS - 1
        const withinBudget = Date.now() - startMs + delay <= MAX_TOTAL_MS

        if (!isRetryableStatus(status) || isLastAttempt || !withinBudget) {
            const code = mapStatusToErrorCode(status)
            logger.error("Google API error", {method, path, status, code, detail})
            return errored({code, detail})
        }

        logger.log("Retrying Google request after transient error", {
            method,
            path,
            status,
            attempt: attempt + 1,
            delay,
        })
        await sleep(delay)
    }

    // The loop always returns inside; this satisfies the type checker.
    return errored({code: "UPSTREAM_ERROR"})
}

export async function googleSheetsRequest<T>({
    method,
    path,
    query,
    body,
    schema,
}: {
    method: Method
    path: string
    query?: Record<string, string>
    body?: unknown
    schema: z.ZodType<T>
}): AsyncResult<T, GoogleApiError> {
    return googleRequest("https://sheets.googleapis.com/v4/spreadsheets", {
        method,
        path,
        query,
        body,
        schema,
    })
}

export async function googleDriveRequest<T>({
    method,
    path,
    query,
    body,
    schema,
}: {
    method: Method
    path: string
    query?: Record<string, string>
    body?: unknown
    schema: z.ZodType<T>
}): AsyncResult<T, GoogleApiError> {
    return googleRequest("https://www.googleapis.com/drive/v3", {method, path, query, body, schema})
}
