import {type AsyncResult, complete, errored, isErrored} from "@attio/fetchable"
import {resolveHeaderRow} from "../columns"
import type {GoogleSheetsError} from "../errors"
import {type ColumnInput, resolveColumns} from "../helpers/column-resolve"
import {buildRowValues, encodeRange, indexToLetter} from "../helpers/range-utils"
import {googleSheetsRequest} from "../request"
import {batchUpdateResponseSchema, updateValuesResponseSchema} from "../schemas"
import {listSheetTabs} from "../tabs"

export default async function prependRow({
    spreadsheetId,
    sheetName,
    columns,
    hasHeader,
}: {
    spreadsheetId: string
    sheetName: string
    columns: ColumnInput[]
    hasHeader: boolean
}): AsyncResult<{rowNumber: number; values: string[]}, GoogleSheetsError> {
    const headerResult = await resolveHeaderRow({spreadsheetId, sheetName, hasHeader})
    if (isErrored(headerResult)) return headerResult

    const resolvedResult = resolveColumns({
        entries: columns,
        header: headerResult.value,
        hasHeader,
    })
    if (isErrored(resolvedResult)) return resolvedResult

    const tabsResult = await listSheetTabs({spreadsheetId})
    if (isErrored(tabsResult)) return tabsResult

    const sheet = tabsResult.value.find(({title}) => title === sheetName)
    if (sheet === undefined) {
        return errored({code: "SHEET_NOT_FOUND", sheetName})
    }
    const sheetId = sheet.sheetId

    const newRowValues = buildRowValues(resolvedResult.value)
    // The new row goes below the header, or at the very top when row 1 is already data.
    const startIndex = hasHeader ? 1 : 0
    const insertedRowNumber = startIndex + 1

    // we insert an empty row first so that we can write with USER_ENTERED option
    const insertResult = await googleSheetsRequest({
        method: "POST",
        path: `/${spreadsheetId}:batchUpdate`,
        body: {
            requests: [
                {
                    insertDimension: {
                        range: {
                            sheetId,
                            dimension: "ROWS",
                            startIndex,
                            endIndex: startIndex + 1,
                        },
                        inheritFromBefore: false,
                    },
                },
            ],
        },
        schema: batchUpdateResponseSchema,
    })
    if (isErrored(insertResult)) return insertResult

    const lastColumn = indexToLetter(newRowValues.length)
    const writeResult = await googleSheetsRequest({
        method: "PUT",
        path: `/${spreadsheetId}/values/${encodeRange(sheetName, `A${insertedRowNumber}:${lastColumn}${insertedRowNumber}`)}`,
        query: {valueInputOption: "USER_ENTERED"},
        body: {values: [newRowValues]},
        schema: updateValuesResponseSchema,
    })
    if (isErrored(writeResult)) return writeResult

    return complete({rowNumber: insertedRowNumber, values: newRowValues})
}
