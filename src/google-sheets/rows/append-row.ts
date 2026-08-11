import {type AsyncResult, complete, errored, isErrored} from "@attio/fetchable"
import {resolveHeaderRow} from "../columns"
import type {GoogleSheetsError} from "../errors"
import {type ColumnInput, resolveColumns} from "../helpers/column-resolve"
import {buildRowValues, encodeRange, parseAppendedRowNumber} from "../helpers/range-utils"
import {googleSheetsRequest} from "../request"
import {appendResponseSchema} from "../schemas"

export default async function appendRow({
    spreadsheetId,
    sheetName,
    columns,
    hasHeader,
    header,
}: {
    spreadsheetId: string
    sheetName: string
    columns: ColumnInput[]
    hasHeader: boolean
    header?: string[]
}): AsyncResult<{rowNumber: number; values: string[]}, GoogleSheetsError> {
    const headerResult = await resolveHeaderRow({spreadsheetId, sheetName, hasHeader, header})
    if (isErrored(headerResult)) return headerResult

    const resolvedResult = resolveColumns({
        entries: columns,
        header: headerResult.value,
        hasHeader,
    })
    if (isErrored(resolvedResult)) return resolvedResult

    const rowValues = buildRowValues(resolvedResult.value)

    const writeResult = await googleSheetsRequest({
        method: "POST",
        path: `/${spreadsheetId}/values/${encodeRange(sheetName)}:append`,
        query: {valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS"},
        body: {values: [rowValues]},
        schema: appendResponseSchema,
    })
    if (isErrored(writeResult)) return writeResult

    const rowNumber = parseAppendedRowNumber(writeResult.value.updates?.updatedRange)
    if (rowNumber === null) {
        return errored({
            code: "PARSE_ERROR",
            detail: "Google Sheets append response did not include the written row number.",
        })
    }

    return complete({rowNumber, values: rowValues})
}
