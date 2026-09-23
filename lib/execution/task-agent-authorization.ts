export async function assertTaskAssignedToAgent(
  supabase: any,
  taskId: string,
  agentId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("agent_tasks")
    .select("agent_id")
    .eq("task_id", taskId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.agent_id) {
    throw new Error("Task is not assigned to the requested agent.");
  }
}
