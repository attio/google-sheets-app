import {isErrored} from "@attio/fetchable"
import {type PlainComboboxOptionsProvider, showToast} from "attio/client"
import {describeError} from "../google-sheets/errors"
import getSpreadsheet from "../server-functions/get-spreadsheet.server"
import listSpreadsheets from "../server-functions/list-spreadsheets.server"
import {createLogger} from "../utils/logger"

const logger = createLogger("spreadsheet-id-provider")

export function createSpreadsheetIdProvider(): PlainComboboxOptionsProvider {
    return {
        async getOption(value) {
            if (!value) return undefined

            const result = await getSpreadsheet({spreadsheetId: value})
            if (isErrored(result)) {
                logger.error("Failed to fetch spreadsheet", {error: result.error})
                showToast({
                    variant: "error",
                    title: "Couldn't get spreadsheet",
                    text: describeError(result.error),
                    durationMs: 10_000,
                })
                return {label: value}
            }

            return {label: result.value.name}
        },
        async search(query) {
            const result = await listSpreadsheets({query})
            if (isErrored(result)) {
                logger.error("Failed to list spreadsheets", {error: result.error})
                showToast({
                    variant: "error",
                    title: "Couldn't list spreadsheets",
                    text: describeError(result.error),
                    durationMs: 10_000,
                })
                return []
            }

            return result.value.map(({id, name}) => ({label: name, value: id}))
        },
    }
}
