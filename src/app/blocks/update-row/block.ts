import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "update-row",
    title: "Update row",
    description:
        "Finds the first row where the values in the specified columns match the given values and updates one or more of its columns.",
    configSchema: Workflows.ConfigSchema.struct({
        spreadsheetId: Workflows.ConfigSchema.string(),
        sheetName: Workflows.ConfigSchema.string(),
        hasHeader: Workflows.ConfigSchema.boolean(),
        lookupColumns: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                column: Workflows.ConfigSchema.string(),
                value: Workflows.ConfigSchema.string(),
            })
        ),
        columns: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                column: Workflows.ConfigSchema.string(),
                value: Workflows.ConfigSchema.string(),
            })
        ),
    }),
    requireUserConnection: true,
})
