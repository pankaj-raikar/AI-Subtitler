import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  console.log('[DEBUG] Webhook POST request received')
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.log('[DEBUG] Missing Svix headers', { svix_id, svix_timestamp, svix_signature })
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Handle user creation event
  const { id } = evt.data
  const eventType = evt.type
  console.log('[DEBUG] Webhook event received', { eventType, id })
  if (eventType === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data

    // Get the primary email address
    const primaryEmail = email_addresses?.[0]?.email_address
    if (!primaryEmail) {
      return new Response('Error: No email address found', { status: 400 })
    }

    // Create user in database
    try {
      console.log('[DEBUG] Creating user in database', { clerkId, email: primaryEmail })
      await prisma.user.create({
        data: {
          clerkId,
          email: primaryEmail,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      })
      console.log('User created successfully:', clerkId)
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  console.log('[DEBUG] Webhook processed successfully')
  return new Response('Webhook received', { status: 200 })
}
