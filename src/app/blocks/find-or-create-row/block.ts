import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "find-or-create-row",
    title: "Find or create row",
    description: "Find a row by a column/value match, or append a new row if no match exists.",
    configSchema: Workflows.ConfigSchema.struct({
        spreadsheetId: Workflows.ConfigSchema.string(),
        sheetName: Workflows.ConfigSchema.string(),
        hasHeader: Workflows.ConfigSchema.boolean(),
        columns: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                column: Workflows.ConfigSchema.string(),
                value: Workflows.ConfigSchema.string(),
            })
        ),
    }),
    requireUserConnection: true,
})
