import {type AsyncResult, complete, isErrored} from "@attio/fetchable"
import type {GoogleApiError} from "./errors"
import {googleSheetsRequest} from "./request"
import {spreadsheetSchema} from "./schemas"

export type SheetTab = {sheetId: number; title: string}

export async function listSheetTabs({
    spreadsheetId,
}: {
    spreadsheetId: string
}): AsyncResult<SheetTab[], GoogleApiError> {
    const result = await googleSheetsRequest({
        method: "GET",
        path: `/${spreadsheetId}`,
        query: {fields: "sheets.properties(sheetId,title)"},
        schema: spreadsheetSchema,
    })
    if (isErrored(result)) return result

    return complete(result.value.sheets.map(({properties}) => properties))
}
