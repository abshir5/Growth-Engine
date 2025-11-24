
export interface Lead {
  id: string;
  name: string;
  sourceGroup: string;
  sourceLink?: string; // URL to the specific post/comment
  painPoint: string;
  intentScore: number; // 0-100
  status: 'new' | 'qualified' | 'discarded';
  relevantProductFeature?: string;
}

export interface GeneratedContent {
  id: string;
  targetLeadId?: string; // If targeting a specific person/group
  headline: string;
  body: string;
  imageUrl?: string;
  affiliateLink: string;
  type: 'post' | 'caption' | 'dm';
  createdAt: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  headline: string;
  body: string;
  createdAt: number;
}

export interface AffiliateProduct {
  name: string;
  description: string;
  link: string;
  niche: string;
  keywords?: string;
  negativeKeywords?: string;
}

export type ViewState = 'dashboard' | 'leads' | 'content' | 'settings' | 'templates';
