/**
 * Shared HubSpot Service
 * Handles HubSpot CRM integration
 */

interface HubSpotContactInput {
  email: string
  firstName: string
  lastName: string
  studentId: string
}

interface HubSpotContactResponse {
  id: string
  properties: Record<string, string>
}

export interface HubSpotSearchResult {
  fullName: string
  email: string
  studentId: string
}

function mapContactResults(results: HubSpotContactResponse[]): HubSpotSearchResult[] {
  return results.map((contact) => {
    const props = contact.properties
    const firstName = props['firstname'] || ''
    const lastName = props['lastname'] || ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    return {
      fullName,
      email: props['email'] || '',
      studentId: props['student_id'] || '',
    }
  }).filter((c) => c.email)
}

export async function searchHubSpotContacts(query: string): Promise<HubSpotSearchResult[]> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN

  if (!accessToken) {
    return []
  }

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const properties = ['email', 'firstname', 'lastname', 'student_id']

  try {
    // Full-text search (covers name and email)
    const textSearchPromise = fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, properties, limit: 5 }),
      }
    )

    // Filter-based search on student_id (custom field not covered by full-text)
    const idFilterPromise = fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'student_id',
              operator: 'CONTAINS_TOKEN',
              value: query,
            }],
          }],
          properties,
          limit: 5,
        }),
      }
    )

    const [textResponse, idResponse] = await Promise.all([textSearchPromise, idFilterPromise])

    const results: HubSpotSearchResult[] = []
    const seenEmails = new Set<string>()

    if (textResponse.ok) {
      const textData = await textResponse.json() as { results: HubSpotContactResponse[] }
      for (const r of mapContactResults(textData.results || [])) {
        if (!seenEmails.has(r.email)) {
          seenEmails.add(r.email)
          results.push(r)
        }
      }
    }

    if (idResponse.ok) {
      const idData = await idResponse.json() as { results: HubSpotContactResponse[] }
      for (const r of mapContactResults(idData.results || [])) {
        if (!seenEmails.has(r.email)) {
          seenEmails.add(r.email)
          results.push(r)
        }
      }
    }

    return results.slice(0, 5)
  } catch (error) {
    console.error('HubSpot search error:', error)
    return []
  }
}

export async function syncContactToHubSpot(contact: HubSpotContactInput): Promise<string | null> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN

  if (!accessToken) {
    console.log('HubSpot integration not configured, skipping sync')
    return null
  }

  try {
    // First, try to find existing contact by email
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: contact.email,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!searchResponse.ok) {
      throw new Error(`HubSpot search failed: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json() as { results: HubSpotContactResponse[] }

    if (searchData.results && searchData.results.length > 0) {
      // Update existing contact
      const existingContact = searchData.results[0]
      if (!existingContact) {
        throw new Error('No contact found in search results')
      }

      const updateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              firstname: contact.firstName,
              lastname: contact.lastName,
              student_id: contact.studentId,
            },
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error(`HubSpot update failed: ${updateResponse.statusText}`)
      }

      return existingContact.id
    } else {
      // Create new contact
      const createResponse = await fetch(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email: contact.email,
              firstname: contact.firstName,
              lastname: contact.lastName,
              student_id: contact.studentId,
            },
          }),
        }
      )

      if (!createResponse.ok) {
        throw new Error(`HubSpot create failed: ${createResponse.statusText}`)
      }

      const createData = await createResponse.json() as HubSpotContactResponse
      return createData.id
    }
  } catch (error) {
    console.error('HubSpot sync error:', error)
    return null
  }
}
