import type {
  PAAPIConfig,
  SearchItemsResponse,
  GetItemsResponse,
} from "./types";
import { signRequest } from "./sigv4";
import type { RateLimiter } from "./utils";

export interface PAAPIClientDeps {
  config: PAAPIConfig;
  fetchFn: typeof fetch;
  rateLimiter: RateLimiter;
  backoff: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createPAAPIClient(deps: PAAPIClientDeps) {
  const { config, fetchFn, rateLimiter, backoff } = deps;

  async function searchItems(
    keywords: string,
    category?: string,
    page?: number,
  ): Promise<SearchItemsResponse> {
    const payload = JSON.stringify({
      Keywords: keywords,
      SearchIndex: category || "All",
      ItemCount: 10,
      ItemPage: page ?? 1,
      PartnerTag: config.partnerTag,
      PartnerType: "Associates",
      Marketplace: config.marketplace,
      Resources: [
        "Images.Primary.Large",
        "Images.Variants.Large",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ByLineInfo",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "Offers.Listings.Availability.Type",
        "BrowseNodeInfo.BrowseNodes",
      ],
    });

    const { headers } = signRequest("SearchItems", payload, config);

    await rateLimiter.acquire();

    return backoff(async () => {
      const res = await fetchFn(
        `https://${config.host}/paapi5/searchitems`,
        { method: "POST", headers, body: payload },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`PA-API SearchItems failed (${res.status}): ${err}`);
      }

      return res.json() as Promise<SearchItemsResponse>;
    });
  }

  async function getItems(asins: string[]): Promise<GetItemsResponse> {
    const payload = JSON.stringify({
      ItemIds: asins,
      ItemIdType: "ASIN",
      PartnerTag: config.partnerTag,
      PartnerType: "Associates",
      Marketplace: config.marketplace,
      Resources: [
        "Images.Primary.Large",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "Offers.Listings.Availability.Type",
      ],
    });

    const { headers } = signRequest("GetItems", payload, config);

    await rateLimiter.acquire();

    return backoff(async () => {
      const res = await fetchFn(
        `https://${config.host}/paapi5/getitems`,
        { method: "POST", headers, body: payload },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`PA-API GetItems failed (${res.status}): ${err}`);
      }

      return res.json() as Promise<GetItemsResponse>;
    });
  }

  return { searchItems, getItems };
}
