import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const agentId =
      typeof body?.agentId === 'string'
        ? body.agentId
        : null

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required.' },
        { status: 400 }
      )
    }

    /*
     * Resolve the user's organization through the existing
     * organization-scoped users table.
     */
    const {
      data: userRecord,
      error: userRecordError,
    } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (
      userRecordError ||
      !userRecord?.organization_id
    ) {
      return NextResponse.json(
        {
          error:
            'Could not determine your organization.',
        },
        { status: 403 }
      )
    }

    /*
     * Confirm that the requested agent belongs to the
     * authenticated user's organization.
     */
    const {
      data: agent,
      error: agentError,
    } = await supabase
      .from('ai_agents')
      .select('id, name')
      .eq('id', agentId)
      .eq(
        'organization_id',
        userRecord.organization_id
      )
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found.' },
        { status: 404 }
      )
    }

    /*
     * Load the most recent connection.
     */
    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from('agent_connections')
      .select(
        `
          id,
          agent_id,
          organization_id,
          status,
          health_status,
          provider,
          connection_type,
          endpoint_url,
          environment
        `
      )
      .eq('agent_id', agent.id)
      .eq(
        'organization_id',
        userRecord.organization_id
      )
      .order('created_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (connectionError) {
      console.error(
        'Failed to load agent connection:',
        connectionError
      )

      return NextResponse.json(
        {
          error:
            'Failed to load the agent connection.',
        },
        { status: 500 }
      )
    }

    if (!connection) {
      return NextResponse.json(
        {
          error:
            'No connection has been configured for this agent.',
        },
        { status: 400 }
      )
    }

    /*
     * IMPORTANT:
     *
     * This first endpoint intentionally does NOT make an
     * outbound request to endpoint_url.
     *
     * Arbitrary outbound URLs require SSRF protection,
     * timeout controls, credential isolation, response
     * validation, and connector-specific verification.
     *
     * Instead, this endpoint confirms that Arbyter can
     * securely resolve the authenticated agent and its
     * connection. The actual connector health check will
     * be added in the next layer.
     */
    const checkedAt = new Date().toISOString()

    const {
      data: healthCheck,
      error: healthCheckError,
    } = await supabase
      .from('agent_health_checks')
      .insert({
        organization_id:
          userRecord.organization_id,
        agent_id: agent.id,
        agent_connection_id:
          connection.id,
        status: 'not_checked',
        latency_ms: null,
        response_status: null,
        error_code: 'CONNECTOR_NOT_IMPLEMENTED',
        error_message:
          'Outbound connector verification has not been enabled yet.',
        details: {
          verification_stage:
            'connection_resolution',
          provider: connection.provider,
          connection_type:
            connection.connection_type,
          environment:
            connection.environment,
          checked_at: checkedAt,
        },
        checked_at: checkedAt,
      })
      .select(
        `
          id,
          status,
          error_code,
          error_message,
          checked_at
        `
      )
      .single()

    if (healthCheckError || !healthCheck) {
      console.error(
        'Failed to record health check:',
        healthCheckError
      )

      return NextResponse.json(
        {
          error:
            'Could not record the verification attempt.',
        },
        { status: 500 }
      )
    }

    /*
     * Keep the connection truthful.
     *
     * We deliberately do NOT mark it connected, verified,
     * or healthy.
     */
    const {
      error: connectionUpdateError,
    } = await supabase
      .from('agent_connections')
      .update({
        status: 'pending',
        health_status: 'unknown',
        last_health_check_at: checkedAt,
      })
      .eq('id', connection.id)
      .eq(
        'organization_id',
        userRecord.organization_id
      )

    if (connectionUpdateError) {
      console.error(
        'Failed to update connection state:',
        connectionUpdateError
      )

      return NextResponse.json(
        {
          error:
            'Verification was recorded, but the connection state could not be updated.',
        },
        { status: 500 }
      )
    }

    /*
     * Record the lifecycle event.
     */
    const {
      error: eventError,
    } = await supabase
      .from('agent_connection_events')
      .insert({
        organization_id:
          userRecord.organization_id,
        agent_id: agent.id,
        agent_connection_id:
          connection.id,
        event_type: 'verification_attempted',
        status: 'not_checked',
        message:
          'Connection resolution completed. Outbound verification is not yet enabled.',
        metadata: {
          health_check_id: healthCheck.id,
          verification_stage:
            'connection_resolution',
        },
      })

    if (eventError) {
      console.error(
        'Failed to record connection event:',
        eventError
      )
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      connection: {
        id: connection.id,
        status: 'pending',
        health_status: 'unknown',
      },
      healthCheck,
      message:
        'Connection resolved successfully. Actual outbound verification is the next connector stage.',
    })
  } catch (error) {
    console.error(
      'Agent verification route failed:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}