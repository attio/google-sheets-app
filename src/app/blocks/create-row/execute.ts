import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {describeError, isRetryable} from "../../../google-sheets/errors"
import {withoutBlankColumns} from "../../../google-sheets/helpers/column-resolve"
import appendRow from "../../../google-sheets/rows/append-row"
import prependRow from "../../../google-sheets/rows/prepend-row"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("create-row")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const columns = withoutBlankColumns(config.columns)
    if (columns.length === 0) {
        return {type: "error", errorMessage: "At least one column must be specified."}
    }

    const args = {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        columns,
        hasHeader: config.hasHeader,
    }
    const result = config.mode === "prepend" ? await prependRow(args) : await appendRow(args)

    if (isErrored(result)) {
        logger.error("Create row failed", {mode: config.mode, error: result.error})
        return {
            type: "error",
            errorMessage: describeError(result.error),
            retryable: isRetryable(result.error),
        }
    }

    return {
        type: "outcome",
        id: "complete",
        data: {row_number: result.value.rowNumber, values: result.value.values},
    }
})
