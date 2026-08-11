import {type AsyncResult, complete, isErrored} from "@attio/fetchable"
import type {GoogleApiError} from "./errors"
import {encodeRange} from "./helpers/range-utils"
import {googleSheetsRequest} from "./request"
import {toCellStrings, VALUE_RENDER_QUERY, valueRangeSchema} from "./schemas"

export async function fetchHeaderRow({
    spreadsheetId,
    sheetName,
}: {
    spreadsheetId: string
    sheetName: string
}): AsyncResult<string[], GoogleApiError> {
    const headerResult = await googleSheetsRequest({
        method: "GET",
        path: `/${spreadsheetId}/values/${encodeRange(sheetName, "1:1")}`,
        query: VALUE_RENDER_QUERY,
        schema: valueRangeSchema,
    })
    if (isErrored(headerResult)) return headerResult
    return complete(toCellStrings(headerResult.value.values)[0] ?? [])
}

export async function resolveHeaderRow({
    spreadsheetId,
    sheetName,
    hasHeader,
    header,
}: {
    spreadsheetId: string
    sheetName: string
    hasHeader: boolean
    header?: string[]
}): AsyncResult<string[], GoogleApiError> {
    if (header !== undefined) return complete(header)
    if (!hasHeader) return complete([])
    return await fetchHeaderRow({spreadsheetId, sheetName})
}
