import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {describeError, isRetryable} from "../../../google-sheets/errors"
import {withoutBlankColumns} from "../../../google-sheets/helpers/column-resolve"
import appendRow from "../../../google-sheets/rows/append-row"
import findRow from "../../../google-sheets/rows/find-row"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("find-or-create-row")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const columns = withoutBlankColumns(config.columns)
    if (columns.length === 0) {
        return {type: "error", errorMessage: "At least one column must be specified."}
    }

    const args = {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        hasHeader: config.hasHeader,
    }

    const findResult = await findRow({...args, lookupColumns: columns})
    if (isErrored(findResult)) {
        logger.error("Lookup failed", {error: findResult.error})
        return {
            type: "error",
            errorMessage: describeError(findResult.error),
            retryable: isRetryable(findResult.error),
        }
    }

    const {row, header} = findResult.value
    if (row !== null) {
        return {
            type: "outcome",
            id: "found",
            data: {row_number: row.rowNumber, values: row.values},
        }
    }

    // The lookup already read row 1, so the header is handed over rather than re-fetched.
    const appendResult = await appendRow({...args, columns, header})
    if (isErrored(appendResult)) {
        logger.error("Create row failed during find-or-create", {error: appendResult.error})
        return {
            type: "error",
            errorMessage: describeError(appendResult.error),
            retryable: isRetryable(appendResult.error),
        }
    }

    return {
        type: "outcome",
        id: "created",
        data: {row_number: appendResult.value.rowNumber, values: appendResult.value.values},
    }
})
