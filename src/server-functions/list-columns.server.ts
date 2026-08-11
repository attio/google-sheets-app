import type {AsyncResult} from "@attio/fetchable"
import {fetchHeaderRow} from "../google-sheets/columns"
import type {GoogleApiError} from "../google-sheets/errors"

export default async function listColumns({
    spreadsheetId,
    sheetName,
}: {
    spreadsheetId: string
    sheetName: string
}): AsyncResult<string[], GoogleApiError> {
    return await fetchHeaderRow({spreadsheetId, sheetName})
}
