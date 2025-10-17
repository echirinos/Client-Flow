export interface HubSpotProvider {
  createContact(input: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
  }): Promise<{ id: string }>;

  createDeal(input: {
    dealname: string;
    amount?: number;
    pipeline?: string;
    dealstage?: string;
    associations?: {
      contacts?: string[];
      companies?: string[];
    };
  }): Promise<{ id: string }>;

  associateDealToContact(dealId: string, contactId: string): Promise<void>;

  updateDeal(dealId: string, properties: Record<string, any>): Promise<void>;

  deleteDeal(dealId: string): Promise<void>;
}
