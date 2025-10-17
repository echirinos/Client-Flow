import { HubSpotProvider } from './provider';
import { prisma } from '../prisma';

const HUBSPOT_BASE_URL = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || '';

interface HubSpotResponse<T> {
  id: string;
  properties: T;
  createdAt: string;
  updatedAt: string;
}

async function hubspotFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot API Error: ${response.status} - ${error}`);
  }

  if (options.method === 'DELETE') {
    return {} as T;
  }

  return response.json();
}

async function logAuditEvent(
  orgId: string,
  action: string,
  targetType: string,
  targetId: string,
  meta: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        actor: 'system:hubspot',
        action,
        targetType,
        targetId,
        meta,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export class HubSpotAdapter implements HubSpotProvider {
  constructor(private orgId: string) {}

  async createContact(input: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
  }): Promise<{ id: string }> {
    const response = await hubspotFetch<HubSpotResponse<any>>(
      '/crm/v3/objects/contacts',
      {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            email: input.email,
            firstname: input.firstname,
            lastname: input.lastname,
            phone: input.phone,
          },
        }),
      }
    );

    await logAuditEvent(
      this.orgId,
      'create_contact',
      'hubspot_contact',
      response.id,
      { input, response }
    );

    return { id: response.id };
  }

  async createDeal(input: {
    dealname: string;
    amount?: number;
    pipeline?: string;
    dealstage?: string;
    associations?: {
      contacts?: string[];
      companies?: string[];
    };
  }): Promise<{ id: string }> {
    const properties: Record<string, any> = {
      dealname: input.dealname,
    };

    if (input.amount !== undefined) {
      properties.amount = input.amount.toString();
    }
    if (input.pipeline) {
      properties.pipeline = input.pipeline;
    }
    if (input.dealstage) {
      properties.dealstage = input.dealstage;
    }

    const body: any = { properties };

    if (input.associations) {
      body.associations = [];

      if (input.associations.contacts) {
        for (const contactId of input.associations.contacts) {
          body.associations.push({
            to: { id: contactId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 3, // Deal to Contact
              },
            ],
          });
        }
      }

      if (input.associations.companies) {
        for (const companyId of input.associations.companies) {
          body.associations.push({
            to: { id: companyId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 5, // Deal to Company
              },
            ],
          });
        }
      }
    }

    const response = await hubspotFetch<HubSpotResponse<any>>(
      '/crm/v3/objects/deals',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    await logAuditEvent(
      this.orgId,
      'create_deal',
      'hubspot_deal',
      response.id,
      { input, response }
    );

    return { id: response.id };
  }

  async associateDealToContact(
    dealId: string,
    contactId: string
  ): Promise<void> {
    await hubspotFetch(
      `/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/3`,
      {
        method: 'PUT',
      }
    );

    await logAuditEvent(
      this.orgId,
      'associate_deal_contact',
      'hubspot_association',
      `${dealId}-${contactId}`,
      { dealId, contactId }
    );
  }

  async updateDeal(
    dealId: string,
    properties: Record<string, any>
  ): Promise<void> {
    const response = await hubspotFetch<HubSpotResponse<any>>(
      `/crm/v3/objects/deals/${dealId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      }
    );

    await logAuditEvent(
      this.orgId,
      'update_deal',
      'hubspot_deal',
      dealId,
      { properties, response }
    );
  }

  async deleteDeal(dealId: string): Promise<void> {
    await hubspotFetch(`/crm/v3/objects/deals/${dealId}`, {
      method: 'DELETE',
    });

    await logAuditEvent(
      this.orgId,
      'delete_deal',
      'hubspot_deal',
      dealId,
      {}
    );
  }
}

export function createHubSpotAdapter(orgId: string): HubSpotProvider {
  return new HubSpotAdapter(orgId);
}
