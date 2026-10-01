import type { Campaign, CampaignStatus, CampaignOccasion, CampaignPlacement } from '@/types/commerce';

// Temporary fallback data for development
// In production, this would be replaced by backend API calls
const fallbackCampaigns: Campaign[] = [
  {
    id: 'fallback-diwali-2024',
    name: 'Diwali 2024 Campaign',
    slug: 'diwali-2024',
    occasion: 'diwali',
    status: 'published' as const,
    startsAt: '2024-10-20T00:00:00Z',
    endsAt: '2024-11-15T23:59:59Z',
    timezone: 'Asia/Kolkata',
    placement: 'header_strip' as const,
    priority: 1,
    label: 'Diwali Specials',
    message: 'Hosting this Diwali? Build the platter with our premium cuts',
    ctaLabel: 'Shop Party Packs',
    destinationType: 'category',
    destinationValue: 'combos',
    backgroundColor: '#FFF8F0',
    foregroundColor: '#2D1810',
    accentColor: '#C8860A',
    buttonColor: '#B4232C',
    buttonTextColor: '#FFFFFF',
    desktopImageUrl: '/assets/campaigns/diwali-desktop.jpg',
    mobileImageUrl: '/assets/campaigns/diwali-mobile.jpg',
    posterImageUrl: '/assets/campaigns/diwali-poster.jpg',
    altText: 'Diwali festival offer - premium meat platters',
    targetLocations: [], // All locations
    targetDevice: 'all',
    analyticsCampaignId: 'diwali_2024_header',
    createdBy: 'admin',
    updatedBy: 'admin',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-01T10:00:00Z',
    publishedAt: '2024-09-01T10:00:00Z',
  }
];

export const campaignApi = {
  getCampaigns: async (options?: {
    status?: CampaignStatus[];
    occasion?: CampaignOccasion[];
    placement?: CampaignPlacement[];
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Campaign[]> => {
    try {
      let results = [...fallbackCampaigns];

      if (options?.status) {
        results = results.filter(campaign => options.status!.includes(campaign.status));
      }
      if (options?.occasion) {
        results = results.filter(campaign => options.occasion!.includes(campaign.occasion));
      }
      if (options?.placement) {
        results = results.filter(campaign => options.placement!.includes(campaign.placement));
      }
      if (options?.activeOnly) {
        const now = new Date();
        results = results.filter(campaign => {
          const start = new Date(campaign.startsAt);
          const end = new Date(campaign.endsAt);
          return campaign.status === 'published' && now >= start && now <= end;
        });
      }

      if (options?.offset !== undefined) {
        results = results.slice(options.offset);
      }
      if (options?.limit !== undefined) {
        results = results.slice(0, options.limit);
      }

      return results;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return fallbackCampaigns;
    }
  },

  getCampaignById: async (id: string): Promise<Campaign | null> => {
    try {
      const campaign = fallbackCampaigns.find(c => c.id === id);
      return campaign ?? null;
    } catch (error) {
      console.error(`Error fetching campaign ${id}:`, error);
      return null;
    }
  },

  createCampaign: async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'archivedAt'>): Promise<Campaign> => {
    try {
      const newCampaign: Campaign = {
        ...campaignData,
        id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fallbackCampaigns.push(newCampaign);
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const index = fallbackCampaigns.findIndex(c => c.id === id);
      if (index === -1) return null;

      const updatedCampaign: Campaign = {
        ...fallbackCampaigns[index],
        ...campaignData,
        updatedAt: new Date().toISOString(),
      };

      fallbackCampaigns[index] = updatedCampaign;
      return updatedCampaign;
    } catch (error) {
      console.error(`Error updating campaign ${id}:`, error);
      throw error;
    }
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    try {
      const index = fallbackCampaigns.findIndex(c => c.id === id);
      if (index === -1) return false;

      fallbackCampaigns[index] = {
        ...fallbackCampaigns[index],
        status: 'archived' as const,
        updatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
      };

      return true;
    } catch (error) {
      console.error(`Error deleting campaign ${id}:`, error);
      return false;
    }
  },

  resolveActiveCampaign: async (options?: {
    now?: Date;
    locationId?: string;
    device?: 'all' | 'desktop' | 'mobile';
  }): Promise<Campaign | null> => {
    try {
      const now = options?.now ?? new Date();
      const locationId = options?.locationId;
      const device = options?.device ?? 'all';

      const activeCampaigns = fallbackCampaigns.filter(campaign => {
        if (campaign.status !== 'published') return false;

        const start = new Date(campaign.startsAt);
        const end = new Date(campaign.endsAt);
        if (now < start || now > end) return false;

        if (campaign.targetLocations && campaign.targetLocations.length > 0) {
          if (!locationId || !campaign.targetLocations.includes(locationId)) {
            return false;
          }
        }

        if (campaign.targetDevice && campaign.targetDevice !== 'all' && campaign.targetDevice !== device) {
          return false;
        }

        return true;
      });

      if (activeCampaigns.length === 0) return null;

      return activeCampaigns
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })[0];
    } catch (error) {
      console.error('Error resolving active campaign:', error);
      return null;
    }
  }
};
