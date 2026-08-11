import {complete, isErrored, type Result} from "@attio/fetchable"
import type {GoogleSheetsError} from "../errors"
import type {ColumnInput} from "../helpers/column-resolve"
import {type FoundRow, findMatchingRow, headerFrom} from "../helpers/row-match"
import {fetchSheetValues} from "./read-values"

export type FindRowResult = {row: FoundRow | null; header: string[]}

// Returns the header alongside the match so a caller that goes on to write (update-row,
// find-or-create-row) can reuse it instead of re-fetching row 1.
export default async function findRow({
    spreadsheetId,
    sheetName,
    lookupColumns,
    hasHeader,
}: {
    spreadsheetId: string
    sheetName: string
    lookupColumns: ColumnInput[]
    hasHeader: boolean
}): Promise<Result<FindRowResult, GoogleSheetsError>> {
    const valuesResult = await fetchSheetValues({spreadsheetId, sheetName})
    if (isErrored(valuesResult)) return valuesResult

    const matchResult = findMatchingRow({values: valuesResult.value, lookupColumns, hasHeader})
    if (isErrored(matchResult)) return matchResult

    return complete({
        row: matchResult.value,
        header: headerFrom(valuesResult.value, hasHeader),
    })
}
