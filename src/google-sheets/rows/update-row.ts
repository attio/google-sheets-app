import {type AsyncResult, complete, isErrored} from "@attio/fetchable"
import {createLogger} from "../../utils/logger"
import {resolveHeaderRow} from "../columns"
import type {GoogleSheetsError} from "../errors"
import {type ColumnInput, type ResolvedColumn, resolveColumns} from "../helpers/column-resolve"
import {buildRange, letterToIndex} from "../helpers/range-utils"
import {googleSheetsRequest} from "../request"
import {batchUpdateValuesResponseSchema} from "../schemas"

const logger = createLogger("google-sheets/update-row")

function mergeUpdatedValues(rowValues: string[], resolved: ResolvedColumn[]): string[] {
    let maxIdx = rowValues.length
    for (const {letter} of resolved) {
        maxIdx = Math.max(maxIdx, letterToIndex(letter))
    }
    const values = new Array<string>(maxIdx).fill("")
    for (let i = 0; i < rowValues.length; i++) {
        values[i] = rowValues[i] ?? ""
    }
    for (const {letter, value} of resolved) {
        values[letterToIndex(letter) - 1] = value
    }
    return values
}

export default async function updateRow({
    spreadsheetId,
    sheetName,
    rowNumber,
    rowValues,
    columns,
    hasHeader,
    header,
}: {
    spreadsheetId: string
    sheetName: string
    rowNumber: number
    rowValues: string[]
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

    const writeResult = await googleSheetsRequest({
        method: "POST",
        path: `/${spreadsheetId}/values:batchUpdate`,
        body: {
            valueInputOption: "USER_ENTERED",
            data: resolvedResult.value.map(({letter, value}) => ({
                range: buildRange(sheetName, `${letter}${rowNumber}`),
                values: [[value]],
            })),
        },
        schema: batchUpdateValuesResponseSchema,
    })
    if (isErrored(writeResult)) {
        logger.error("Row update failed", {rowNumber, error: writeResult.error})
        return writeResult
    }

    return complete({rowNumber, values: mergeUpdatedValues(rowValues, resolvedResult.value)})
}
