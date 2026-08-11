import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {describeError, isRetryable} from "../../../google-sheets/errors"
import {withoutBlankColumns} from "../../../google-sheets/helpers/column-resolve"
import findRows from "../../../google-sheets/rows/find-rows"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("find-matching-rows")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const lookupColumns = withoutBlankColumns(config.lookupColumns)
    if (lookupColumns.length === 0) {
        return {type: "error", errorMessage: "At least one column to match must be specified."}
    }

    const result = await findRows({
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        lookupColumns,
        hasHeader: config.hasHeader,
    })

    if (isErrored(result)) {
        logger.error("Lookup failed", {error: result.error})
        return {
            type: "error",
            errorMessage: describeError(result.error),
            retryable: isRetryable(result.error),
        }
    }

    if (result.value.length === 0) {
        return {type: "outcome", id: "not_found", data: null}
    }

    return {
        type: "outcome",
        id: "found",
        data: {
            rows: result.value.map((row) => ({row_number: row.rowNumber, values: row.values})),
        },
    }
})
