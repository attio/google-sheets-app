import {isErrored} from "@attio/fetchable"
import {type PlainComboboxOptionsProvider, showToast} from "attio/client"
import {describeError} from "../google-sheets/errors"
import listSheetTabs from "../server-functions/list-sheet-tabs.server"
import {createLogger} from "../utils/logger"

const logger = createLogger("sheet-name-provider")

export function createSheetsNameProvider(
    spreadsheetId: string | undefined
): PlainComboboxOptionsProvider {
    return {
        async getOption(value) {
            return value ? {label: value} : undefined
        },
        async search(query) {
            if (spreadsheetId === undefined) return []

            const result = await listSheetTabs({spreadsheetId})
            if (isErrored(result)) {
                logger.error("Failed to list sheets", {error: result.error})
                showToast({
                    variant: "error",
                    title: "Couldn't list sheets",
                    text: describeError(result.error),
                    durationMs: 10_000,
                })
                return []
            }

            const lowerQuery = query.toLowerCase()
            return result.value
                .filter(({title}) => title.toLowerCase().includes(lowerQuery))
                .map(({title}) => ({label: title, value: title}))
        },
    }
}
