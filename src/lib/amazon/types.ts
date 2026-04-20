export interface PAAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  host: string;
  region: string;
  marketplace: string;
}

export type PAAPIOperation = "SearchItems" | "GetItems";

export interface PAAPIPrice {
  Amount: number;
  Currency: string;
  DisplayAmount: string;
}

export interface PAAPIListing {
  Price?: PAAPIPrice;
  SavingBasis?: PAAPIPrice;
  Availability?: { Type: string };
}

export interface PAAPIImage {
  URL: string;
  Width: number;
  Height: number;
}

export interface PAAPIItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: {
    Title?: { DisplayValue: string };
    Features?: { DisplayValues: string[] };
    ByLineInfo?: { Brand?: { DisplayValue: string } };
  };
  Offers?: { Listings?: PAAPIListing[] };
  Images?: {
    Primary?: { Large?: PAAPIImage };
    Variants?: { Large?: PAAPIImage }[];
  };
  BrowseNodeInfo?: {
    BrowseNodes?: { Id: string; DisplayName: string }[];
  };
}

export interface SearchItemsResponse {
  SearchResult?: {
    Items?: PAAPIItem[];
    TotalResultCount?: number;
  };
  Errors?: PAAPIError[];
}

export interface GetItemsResponse {
  ItemsResult?: {
    Items?: PAAPIItem[];
  };
  Errors?: PAAPIError[];
}

export interface PAAPIError {
  Code: string;
  Message: string;
}

export interface SyncResult {
  synced: number;
  errors: string[];
}

export interface PriceUpdateResult {
  updated: number;
  errors: string[];
}
