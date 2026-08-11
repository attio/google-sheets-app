import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "find-matching-rows",
    title: "Find matching rows",
    description:
        "Find all rows in a Google Sheet where the values in the specified columns match the given values.",
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
    }),
    requireUserConnection: true,
})
