import {type AsyncResult, complete, isErrored} from "@attio/fetchable"
import type {GoogleApiError} from "../errors"
import {encodeRange} from "../helpers/range-utils"
import {googleSheetsRequest} from "../request"
import {toCellStrings, VALUE_RENDER_QUERY, valueRangeSchema} from "../schemas"

export async function fetchSheetValues({
    spreadsheetId,
    sheetName,
}: {
    spreadsheetId: string
    sheetName: string
}): AsyncResult<string[][], GoogleApiError> {
    const result = await googleSheetsRequest({
        method: "GET",
        path: `/${spreadsheetId}/values/${encodeRange(sheetName)}`,
        query: VALUE_RENDER_QUERY,
        schema: valueRangeSchema,
    })
    if (isErrored(result)) return result

    return complete(toCellStrings(result.value.values))
}
