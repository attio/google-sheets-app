import {isErrored, type Result} from "@attio/fetchable"
import type {GoogleSheetsError} from "../errors"
import type {ColumnInput} from "../helpers/column-resolve"
import {type FoundRow, findAllMatchingRows} from "../helpers/row-match"
import {fetchSheetValues} from "./read-values"

export default async function findRows({
    spreadsheetId,
    sheetName,
    lookupColumns,
    hasHeader,
}: {
    spreadsheetId: string
    sheetName: string
    lookupColumns: ColumnInput[]
    hasHeader: boolean
}): Promise<Result<FoundRow[], GoogleSheetsError>> {
    const valuesResult = await fetchSheetValues({spreadsheetId, sheetName})
    if (isErrored(valuesResult)) return valuesResult

    return findAllMatchingRows({values: valuesResult.value, lookupColumns, hasHeader})
}
