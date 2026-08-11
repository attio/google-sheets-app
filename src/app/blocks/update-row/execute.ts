import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {describeError, isRetryable} from "../../../google-sheets/errors"
import {withoutBlankColumns} from "../../../google-sheets/helpers/column-resolve"
import findRow from "../../../google-sheets/rows/find-row"
import updateRow from "../../../google-sheets/rows/update-row"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("update-row")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const lookupColumns = withoutBlankColumns(config.lookupColumns)
    if (lookupColumns.length === 0) {
        return {type: "error", errorMessage: "At least one column to match must be specified."}
    }

    const columns = withoutBlankColumns(config.columns)
    if (columns.length === 0) {
        return {type: "error", errorMessage: "At least one column to update must be specified."}
    }

    const args = {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        hasHeader: config.hasHeader,
    }

    const findResult = await findRow({...args, lookupColumns})
    if (isErrored(findResult)) {
        logger.error("Lookup failed during update", {error: findResult.error})
        return {
            type: "error",
            errorMessage: describeError(findResult.error),
            retryable: isRetryable(findResult.error),
        }
    }

    const {row, header} = findResult.value
    if (row === null) {
        return {type: "outcome", id: "not_found", data: null}
    }

    // The lookup already read row 1, so the header is handed over rather than re-fetched.
    const updateResult = await updateRow({
        ...args,
        rowNumber: row.rowNumber,
        rowValues: row.values,
        columns,
        header,
    })
    if (isErrored(updateResult)) {
        logger.error("Update failed", {error: updateResult.error})
        return {
            type: "error",
            errorMessage: describeError(updateResult.error),
            retryable: isRetryable(updateResult.error),
        }
    }

    return {
        type: "outcome",
        id: "updated",
        data: {row_number: updateResult.value.rowNumber, values: updateResult.value.values},
    }
})
