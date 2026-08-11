import {isErrored} from "@attio/fetchable"
import {type PlainComboboxOption, type PlainComboboxOptionsProvider, showToast} from "attio/client"
import {describeError} from "../google-sheets/errors"
import {isColumnLetter} from "../google-sheets/helpers/column-resolve"
import {indexToLetter} from "../google-sheets/helpers/range-utils"
import listColumns from "../server-functions/list-columns.server"
import {createLogger} from "../utils/logger"

const logger = createLogger("column-provider")

const DEFAULT_LETTER_COUNT = 26

function matchesQuery(option: PlainComboboxOption, query: string): boolean {
    const lowerQuery = query.trim().toLowerCase()
    if (lowerQuery === "") return true

    return (
        option.label.toLowerCase().includes(lowerQuery) ||
        (option.description?.toLowerCase().includes(lowerQuery) ?? false)
    )
}

function headerOptions(firstRow: string[]): PlainComboboxOption[] {
    const seen = new Set<string>()
    const options: PlainComboboxOption[] = []

    for (const name of firstRow) {
        if (name.trim() === "" || seen.has(name)) continue
        seen.add(name)
        options.push({label: name, value: name})
    }
    return options
}

function letterOptions(firstRow: string[]): PlainComboboxOption[] {
    const count = firstRow.length > 0 ? firstRow.length : DEFAULT_LETTER_COUNT
    const options: PlainComboboxOption[] = []

    for (let index = 1; index <= count; index++) {
        const letter = indexToLetter(index)
        const sample = firstRow[index - 1] ?? ""
        options.push({
            label: letter,
            value: letter,
            ...(sample.trim() === "" ? {} : {description: sample}),
        })
    }
    return options
}

function withFallbackOptions(options: PlainComboboxOption[], query: string): PlainComboboxOption[] {
    const trimmedQuery = query.trim()
    if (trimmedQuery === "") return options

    const result = [...options]
    const isOffered = (value: string): boolean =>
        result.some((option) => option.value.toLowerCase() === value.toLowerCase())

    if (isColumnLetter(trimmedQuery) && !isOffered(trimmedQuery)) {
        result.push({
            label: `Column ${trimmedQuery.toUpperCase()}`,
            value: trimmedQuery.toUpperCase(),
        })
    }
    if (result.length === 0) {
        result.push({label: trimmedQuery, value: trimmedQuery})
    }
    return result
}

export function createColumnProvider({
    spreadsheetId,
    sheetName,
    hasHeader,
}: {
    spreadsheetId: string | undefined
    sheetName: string | undefined
    hasHeader: boolean
}): PlainComboboxOptionsProvider {
    return {
        async getOption(value) {
            return value ? {label: value} : undefined
        },
        async search(query) {
            if (spreadsheetId === undefined || sheetName === undefined) {
                return withFallbackOptions([], query)
            }

            const result = await listColumns({spreadsheetId, sheetName})
            if (isErrored(result)) {
                logger.error("Failed to list columns", {error: result.error})
                showToast({
                    variant: "error",
                    title: "Couldn't list columns",
                    text: describeError(result.error),
                    durationMs: 10_000,
                })
                return withFallbackOptions([], query)
            }

            const options = hasHeader ? headerOptions(result.value) : letterOptions(result.value)
            return withFallbackOptions(
                options.filter((option) => matchesQuery(option, query)),
                query
            )
        },
    }
}
