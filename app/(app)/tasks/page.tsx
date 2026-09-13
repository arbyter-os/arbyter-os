async function executeTask(taskId: string) {
  if (executingTaskId) return

  setError(null)
  setSuccess(null)
  setExecutingTaskId(taskId)

  try {
    const response = await fetch('/api/tasks/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
      }),
    })

    const text = await response.text()

    let data: any = {}

    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }

    if (!response.ok) {
      throw new Error(
        data?.error ??
          `Task execution failed (${response.status}).`
      )
    }

    setSuccess(
      `Task executed successfully through ${data.provider}.`
    )

    await loadData()
  } catch (err) {
    console.error('Failed to execute task:', err)

    await loadData()

    setError(
      err instanceof Error
        ? err.message
        : 'Failed to execute task.'
    )
  } finally {
    setExecutingTaskId(null)
  }
}