import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "find-matching-row",
    title: "Find matching row",
    description:
        "Find the first row in a Google Sheet where the values in the specified columns match the given values.",
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
