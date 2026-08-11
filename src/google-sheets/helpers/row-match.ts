import {complete, isErrored, type Result} from "@attio/fetchable"
import type {GoogleSheetsError} from "../errors"
import {type ColumnInput, type ResolvedColumn, resolveColumns} from "./column-resolve"
import {letterToIndex} from "./range-utils"

export type FoundRow = {rowNumber: number; values: string[]}

function firstDataIndex(hasHeader: boolean): number {
    return hasHeader ? 1 : 0
}

export function headerFrom(values: string[][], hasHeader: boolean): string[] {
    return hasHeader ? (values[0] ?? []) : []
}

function rowMatches(row: string[], resolved: ResolvedColumn[]): boolean {
    return resolved.every(({letter, value}) => row[letterToIndex(letter) - 1] === value)
}

function resolveLookupColumns(
    values: string[][],
    lookupColumns: ColumnInput[],
    hasHeader: boolean
): Result<ResolvedColumn[], GoogleSheetsError> {
    return resolveColumns({
        entries: lookupColumns,
        header: headerFrom(values, hasHeader),
        hasHeader,
    })
}

export function findMatchingRow({
    values,
    lookupColumns,
    hasHeader,
}: {
    values: string[][]
    lookupColumns: ColumnInput[]
    hasHeader: boolean
}): Result<FoundRow | null, GoogleSheetsError> {
    const startIndex = firstDataIndex(hasHeader)
    if (values.length <= startIndex) return complete(null)

    const resolvedResult = resolveLookupColumns(values, lookupColumns, hasHeader)
    if (isErrored(resolvedResult)) return resolvedResult

    for (let rowIndex = startIndex; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex] ?? []
        if (rowMatches(row, resolvedResult.value)) {
            return complete({rowNumber: rowIndex + 1, values: row})
        }
    }
    return complete(null)
}

export function findAllMatchingRows({
    values,
    lookupColumns,
    hasHeader,
}: {
    values: string[][]
    lookupColumns: ColumnInput[]
    hasHeader: boolean
}): Result<FoundRow[], GoogleSheetsError> {
    const startIndex = firstDataIndex(hasHeader)
    if (values.length <= startIndex) return complete([])

    const resolvedResult = resolveLookupColumns(values, lookupColumns, hasHeader)
    if (isErrored(resolvedResult)) return resolvedResult

    const matches: FoundRow[] = []
    for (let rowIndex = startIndex; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex] ?? []
        if (rowMatches(row, resolvedResult.value)) {
            matches.push({rowNumber: rowIndex + 1, values: row})
        }
    }
    return complete(matches)
}
