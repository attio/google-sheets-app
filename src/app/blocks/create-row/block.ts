import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "create-row",
    title: "Create row",
    description:
        "Append or prepend a new row to a Google Sheet, with values for one or more columns.",
    configSchema: Workflows.ConfigSchema.struct({
        spreadsheetId: Workflows.ConfigSchema.string(),
        sheetName: Workflows.ConfigSchema.string(),
        hasHeader: Workflows.ConfigSchema.boolean(),
        mode: Workflows.ConfigSchema.stringEnum(["append", "prepend"]),
        columns: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                column: Workflows.ConfigSchema.string(),
                value: Workflows.ConfigSchema.string(),
            })
        ),
    }),
    requireUserConnection: true,
})
