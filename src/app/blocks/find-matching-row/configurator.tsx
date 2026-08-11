import {Workflows} from "attio/client"
import {createColumnProvider} from "../../../providers/column.provider"
import {createSheetsNameProvider} from "../../../providers/sheet-name.provider"
import {createSpreadsheetIdProvider} from "../../../providers/spreadsheet-id.provider"
import block from "./block"

export default Workflows.defineConfigurator(block, () => {
    const {TextInput, Outcome, ComboboxInput, CheckboxInput, CollectionInput, watch} =
        Workflows.useConfigurator(block, {hasHeader: true})

    const spreadsheetIdConfig = watch("spreadsheetId")
    const spreadsheetId =
        spreadsheetIdConfig?.type === "static" ? spreadsheetIdConfig.value : undefined

    const sheetNameConfig = watch("sheetName")
    const sheetName = sheetNameConfig?.type === "static" ? sheetNameConfig.value : undefined

    const hasHeaderConfig = watch("hasHeader")
    const hasHeader = hasHeaderConfig?.type === "static" ? hasHeaderConfig.value : true

    const columnProvider = createColumnProvider({spreadsheetId, sheetName, hasHeader})
    const columnHelp = hasHeader
        ? "Pick a column by its header name, or enter a column letter (e.g. A)."
        : "Pick a column by letter (e.g. A)."

    return (
        <>
            <ComboboxInput
                name="spreadsheetId"
                label="Spreadsheet"
                help="Select a spreadsheet from your Google Drive."
                options={createSpreadsheetIdProvider()}
            />
            <ComboboxInput
                name="sheetName"
                label="Sheet name"
                help="The tab name within the spreadsheet."
                options={createSheetsNameProvider(spreadsheetId)}
            />
            <CheckboxInput
                name="hasHeader"
                label="First row is a header row"
                help="Row 1 is treated as column names and is never matched. Turn this off if your sheet starts straight into data, and reference columns by letter."
                disableVariables
            />
            <CollectionInput
                name="lookupColumns"
                label="Columns to match"
                addItemLabel="Add column"
                minItems={1}
            >
                {(item) => (
                    <>
                        <ComboboxInput
                            name={`${item}.column`}
                            label="Column"
                            help={columnHelp}
                            options={columnProvider}
                        />
                        <TextInput name={`${item}.value`} label="Value to match" />
                    </>
                )}
            </CollectionInput>
            <Outcome
                id="found"
                label="Row found"
                schema={Workflows.OutcomeSchema.struct({
                    row_number: Workflows.OutcomeSchema.number().title("Row number"),
                    values: Workflows.OutcomeSchema.array(Workflows.OutcomeSchema.string()).title(
                        "Values"
                    ),
                })}
            />
            <Outcome id="not_found" label="Row not found" schema={null} />
        </>
    )
})
